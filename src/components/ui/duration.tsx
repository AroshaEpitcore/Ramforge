import { formatDuration } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import type { ComponentProps } from "react";

export interface DurationProps extends ComponentProps<"span"> {
  seconds: number;
  variant?: "clock" | "long";
  withIcon?: boolean;
}

/** Inline duration display, e.g. a video length of 3725s → "1:02:05". */
export function Duration({
  seconds,
  variant = "clock",
  withIcon = false,
  className,
  ...props
}: DurationProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 tabular-nums", className)}
      {...props}
    >
      {withIcon && <Clock className="size-3.5 opacity-70" />}
      {formatDuration(seconds, variant)}
    </span>
  );
}
