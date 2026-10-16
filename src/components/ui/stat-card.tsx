import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

export interface StatCardProps extends ComponentProps<typeof Card> {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  /** Signed percentage change vs. previous period. */
  delta?: number;
  deltaLabel?: string;
  hint?: string;
}

/** Dashboard KPI tile with optional trend indicator. */
export function StatCard({
  label,
  value,
  icon,
  delta,
  deltaLabel = "vs last period",
  hint,
  className,
  ...props
}: StatCardProps) {
  const positive = typeof delta === "number" && delta >= 0;
  return (
    <Card className={cn("gap-3 p-5", className)} {...props}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {icon && (
          <span className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4">
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
        {typeof delta === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              positive ? "text-success" : "text-destructive",
            )}
          >
            {positive ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      {(hint || typeof delta === "number") && (
        <p className="text-xs text-muted-foreground">{hint ?? deltaLabel}</p>
      )}
    </Card>
  );
}
