"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { accountNav, mainNav } from "@/config/nav";
import { mockVideos } from "@/mocks";
import { useUIStore } from "@/stores/ui-store";
import type { LucideIcon } from "lucide-react";
import { Clapperboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export interface CommandEntry {
  label: string;
  href: string;
  icon?: LucideIcon;
  keywords?: string[];
}

export interface CommandGroupSpec {
  heading: string;
  items: CommandEntry[];
}

/**
 * Default storefront command groups. Built inside this Client Component so that
 * icon *components* never cross the server→client boundary (which React forbids).
 */
function defaultGroups(): CommandGroupSpec[] {
  return [
    { heading: "Browse", items: mainNav.map((n) => ({ label: n.title, href: n.href })) },
    {
      heading: "Account",
      items: accountNav.map((n) => ({ label: n.title, href: n.href, icon: n.icon })),
    },
    {
      heading: "Videos",
      items: mockVideos.slice(0, 6).map((v) => ({
        label: v.title,
        href: `/video/${v.slug}`,
        icon: Clapperboard,
        keywords: v.tags,
      })),
    },
  ];
}

/**
 * Global ⌘K command palette. Open state lives in the UI store so any trigger
 * (storefront search, admin topbar) can open it. Register once per layout.
 */
export function CommandPalette({ groups = defaultGroups() }: { groups?: CommandGroupSpec[] }) {
  const router = useRouter();
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!useUIStore.getState().commandOpen);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search videos, pages and actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((group) => (
          <CommandGroup key={group.heading} heading={group.heading}>
            {group.items.map((item) => (
              <CommandItem
                key={item.href + item.label}
                value={`${item.label} ${item.keywords?.join(" ") ?? ""}`}
                onSelect={() => go(item.href)}
              >
                {item.icon && <item.icon />}
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
