import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  icon?: ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}

/** "Featured Tutorials ... View All →" style section header. */
export function SectionHeader({
  title,
  icon,
  viewAllHref,
  viewAllLabel = "View all",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        {icon && <span className="text-primary [&_svg]:size-5">{icon}</span>}
        {title}
      </h2>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          {viewAllLabel}
          <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
