import { cn } from "@/lib/utils";
import type { Category } from "@/types";
import Link from "next/link";
import type { ComponentProps } from "react";

interface CategoryChipProps extends Omit<ComponentProps<typeof Link>, "href"> {
  category: Pick<Category, "name" | "slug" | "videoCount">;
  href?: string;
  active?: boolean;
  showCount?: boolean;
}

/** Pill-style category link used in filter bars and category rails. */
export function CategoryChip({
  category,
  href,
  active = false,
  showCount = false,
  className,
  ...props
}: CategoryChipProps) {
  return (
    <Link
      href={href ?? `/shop?category=${category.slug}`}
      data-active={active}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent",
        className,
      )}
      {...props}
    >
      {category.name}
      {showCount && typeof category.videoCount === "number" && (
        <span
          className={cn(
            "rounded-full px-1.5 text-xs tabular-nums",
            active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
          )}
        >
          {category.videoCount}
        </span>
      )}
    </Link>
  );
}
