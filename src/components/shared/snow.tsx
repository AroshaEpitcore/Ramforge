"use client";

import { Button } from "@/components/ui/button";
import { Snowflake } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

const STORAGE_KEY = "frameforge:snow";

type SnowContextValue = { enabled: boolean; toggle: () => void; mounted: boolean };
const SnowContext = createContext<SnowContextValue | null>(null);

/**
 * Festive snow, globally available but opt-out. Defaults ON for the holiday
 * launch; the choice is remembered in localStorage. The actual snowfall is
 * rendered here (once) and skipped on admin routes so the work area stays calm.
 * Reduced-motion users never see it (handled in CSS).
 */
export function SnowProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setEnabled(saved === "on");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = () =>
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      } catch {
        /* ignore */
      }
      return next;
    });

  const showSnow = mounted && enabled && !pathname?.startsWith("/admin");

  return (
    <SnowContext.Provider value={{ enabled, toggle, mounted }}>
      {children}
      {showSnow && <SnowFall />}
    </SnowContext.Provider>
  );
}

export function useSnow() {
  const ctx = useContext(SnowContext);
  if (!ctx) throw new Error("useSnow must be used within a SnowProvider");
  return ctx;
}

/** Kept deliberately small for a light, non-distracting effect. */
const FLAKE_COUNT = 26;

/** Deterministic 0–1 pseudo-random from a seed — pure, so it is SSR-safe. */
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function SnowFall() {
  // Varied-looking but deterministic flakes (no Math.random): identical on the
  // server and client, so there is no hydration mismatch and no re-render churn.
  const flakes = useMemo(
    () =>
      Array.from({ length: FLAKE_COUNT }, (_, id) => ({
        id,
        left: rand(id + 1) * 100, // vw
        size: 2 + rand(id + 100) * 5, // 2–7px
        duration: 9 + rand(id + 200) * 9, // 9–18s, slow
        delay: -rand(id + 300) * 18, // desync so they don't start together
        opacity: 0.25 + rand(id + 400) * 0.45,
        drift: (rand(id + 500) - 0.5) * 60, // px horizontal sway
        blur: rand(id + 600) < 0.4,
      })),
    [],
  );

  return (
    <div className="snow-layer pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden>
      {flakes.map((f) => (
        <span
          key={f.id}
          className="snow-flake"
          style={
            {
              left: `${f.left}vw`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              opacity: f.opacity,
              filter: f.blur ? "blur(1px)" : undefined,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
              "--snow-drift": `${f.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** Snowflake button for the navbar; lights up blue when snow is on. */
export function SnowToggle() {
  const { enabled, toggle, mounted } = useSnow();
  const on = mounted && enabled;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={on ? "Turn off snow" : "Turn on snow"}
      aria-pressed={mounted ? enabled : undefined}
      title="Festive snow"
      onClick={toggle}
      className={on ? "text-sky-400 hover:text-sky-400" : undefined}
    >
      <Snowflake className="size-5" />
    </Button>
  );
}
