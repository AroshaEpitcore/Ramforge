"use client";

import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { useState } from "react";

export interface RatingProps {
  /** Current rating value (0–max). */
  value?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  /** When set, stars become interactive and call back with the new value. */
  onChange?: (value: number) => void;
  readOnly?: boolean;
  className?: string;
  "aria-label"?: string;
}

const sizeMap = { sm: "size-3.5", md: "size-4", lg: "size-6" } as const;

/** Star rating. Read-only by default; pass `onChange` for an input. */
export function Rating({
  value = 0,
  max = 5,
  size = "md",
  onChange,
  readOnly = !onChange,
  className,
  ...props
}: RatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div
      role={readOnly ? "img" : "radiogroup"}
      aria-label={props["aria-label"] ?? `Rated ${value} out of ${max}`}
      className={cn("inline-flex items-center gap-0.5", className)}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const filled = display >= starValue;
        const half = !filled && display >= starValue - 0.5;
        const Icon = (
          <Star
            className={cn(
              sizeMap[size],
              "transition-colors",
              filled || half ? "fill-warning text-warning" : "fill-transparent text-muted-foreground/40",
            )}
          />
        );
        if (readOnly) return <span key={i}>{Icon}</span>;
        return (
          <button
            key={i}
            type="button"
            aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
            aria-checked={value === starValue}
            role="radio"
            className="rounded-sm transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            onMouseEnter={() => setHover(starValue)}
            onClick={() => onChange?.(starValue)}
          >
            {Icon}
          </button>
        );
      })}
    </div>
  );
}
