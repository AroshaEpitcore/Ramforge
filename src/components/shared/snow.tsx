import type { CSSProperties } from "react";

/** Kept deliberately small for a light, non-distracting effect. */
const FLAKE_COUNT = 26;

/** Deterministic 0–1 pseudo-random from a seed — pure, so it is SSR-safe. */
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Varied-looking but fully deterministic flakes (no Math.random), computed once.
const FLAKES = Array.from({ length: FLAKE_COUNT }, (_, id) => ({
  id,
  left: rand(id + 1) * 100, // vw
  size: 2 + rand(id + 100) * 5, // 2–7px
  duration: 9 + rand(id + 200) * 9, // 9–18s, slow
  delay: -rand(id + 300) * 18, // desync so they don't start together
  opacity: 0.25 + rand(id + 400) * 0.45,
  drift: (rand(id + 500) - 0.5) * 60, // px horizontal sway
  blur: rand(id + 600) < 0.4,
}));

/**
 * Light festive snowfall overlay. Site-wide, toggled by admins from
 * Admin → Settings; rendered only on the storefront (never the admin area).
 * Reduced-motion users never see it (handled in CSS).
 */
export function Snow({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <div className="snow-layer pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden>
      {FLAKES.map((f) => (
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
