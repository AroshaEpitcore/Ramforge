import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

interface PageHeaderProps extends ComponentProps<"div"> {
  title: string;
  description?: string;
  /** Action buttons rendered on the right. */
  actions?: ReactNode;
}

/** Reusable page title block (admin + account content areas). */
export function PageHeader({ title, description, actions, className, ...props }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
