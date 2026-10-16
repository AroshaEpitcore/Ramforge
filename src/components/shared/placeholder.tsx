import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Construction } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
  /** Short note on what this page will contain once built. */
  note?: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Consistent "scaffolded, not yet built" page. Every route group ships one of
 * these so all layouts are viewable. Replace with the real page later.
 */
export function PlaceholderPage({
  title,
  description,
  note,
  backHref,
  backLabel = "Go back",
  className,
  children,
}: PlaceholderPageProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <Badge variant="muted" className="gap-1">
          <Construction className="size-3" />
          Scaffold placeholder
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="max-w-2xl text-muted-foreground">{description}</p>}
      </div>

      <Card>
        <CardContent className="flex flex-col items-start gap-3 py-8">
          <p className="text-sm text-muted-foreground">
            {note ??
              "This page is part of the foundation scaffold. The layout, navigation and components are production-ready — the page content is built on top in a later phase."}
          </p>
          {backHref && (
            <Button asChild variant="outline" size="sm">
              <Link href={backHref}>{backLabel}</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {children}
    </div>
  );
}
