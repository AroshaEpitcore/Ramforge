"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import type { ComponentProps } from "react";

/** Search field with a leading icon and an optional clear button. */
export function SearchInput({
  className,
  value,
  onClear,
  ...props
}: ComponentProps<typeof Input> & { onClear?: () => void }) {
  const showClear = Boolean(onClear && value);
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        role="searchbox"
        value={value}
        className={cn("px-9 [&::-webkit-search-cancel-button]:appearance-none", className)}
        {...props}
      />
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
