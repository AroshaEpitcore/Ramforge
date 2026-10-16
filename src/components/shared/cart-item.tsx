"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ENTITLEMENT_LABELS } from "@/config/constants";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { CartLine } from "@/types";
import { Layers, Trash2 } from "lucide-react";
import Image from "next/image";

export interface CartItemProps {
  line: CartLine;
  onRemove?: (id: string) => void;
  className?: string;
}

export function CartItem({ line, onRemove, className }: CartItemProps) {
  return (
    <div className={cn("flex gap-3 py-4", className)}>
      <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md border">
        <Image src={line.thumbnailUrl} alt={line.title} fill sizes="112px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-medium">{line.title}</p>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(line.id)}
              aria-label={`Remove ${line.title}`}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          {line.kind === "bundle" ? (
            <Badge variant="secondary" className="gap-1">
              <Layers className="size-3" />
              Bundle
            </Badge>
          ) : (
            line.option && <Badge variant="muted">{ENTITLEMENT_LABELS[line.option]}</Badge>
          )}
          {line.rentalDays && (
            <span className="text-xs text-muted-foreground">{line.rentalDays} days</span>
          )}
        </div>
        <div className="mt-auto pt-2 text-sm font-semibold tabular-nums">
          {formatCurrency(line.unitPrice * line.quantity)}
        </div>
      </div>
    </div>
  );
}
