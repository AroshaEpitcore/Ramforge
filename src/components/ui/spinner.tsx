import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";

/** Accessible loading spinner. Announce context with `label` for screen readers. */
export function Spinner({
  className,
  label = "Loading",
  ...props
}: ComponentProps<typeof Loader2> & { label?: string }) {
  return (
    <Loader2
      role="status"
      aria-label={label}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}
