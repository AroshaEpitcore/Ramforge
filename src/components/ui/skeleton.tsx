import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/**
 * Placeholder surface for loading states. Uses the shared shimmer utility so
 * motion stays consistent and respects `prefers-reduced-motion`.
 */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("skeleton-shimmer rounded-md bg-muted", className)}
      {...props}
    />
  );
}
