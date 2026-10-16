"use client";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

/**
 * Opens the command palette. Renders as a faux search field on desktop and a
 * single icon button on mobile.
 */
export function SearchTrigger({ className }: { className?: string }) {
  const setOpen = useUIStore((s) => s.setCommandOpen);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "hidden h-9 w-full max-w-xs items-center gap-2 rounded-full border border-input bg-muted/50 px-3.5 text-sm text-muted-foreground transition-colors hover:bg-muted md:inline-flex",
          className,
        )}
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search tutorials, tools…</span>
        <Kbd>⌘K</Kbd>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Search"
        onClick={() => setOpen(true)}
      >
        <Search className="size-5" />
      </Button>
    </>
  );
}
