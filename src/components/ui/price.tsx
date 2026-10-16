import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { discountPercent, formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export interface PriceProps extends ComponentProps<"div"> {
  /** Price in integer minor units (e.g. cents). */
  price: number;
  /** Optional sale price in minor units; renders a strike-through on `price`. */
  salePrice?: number | null;
  currency?: string;
  size?: "sm" | "md" | "lg";
  showDiscountBadge?: boolean;
}

const sizeClasses: Record<NonNullable<PriceProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
};

/** Currency display with optional sale strike-through and discount badge. */
export function Price({
  price,
  salePrice,
  currency = siteConfig.currency,
  size = "md",
  showDiscountBadge = false,
  className,
  ...props
}: PriceProps) {
  const onSale = typeof salePrice === "number" && salePrice < price;
  const current = onSale ? salePrice! : price;
  const percent = onSale ? discountPercent(price, salePrice!) : 0;

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <span className={cn("font-semibold tabular-nums", sizeClasses[size])}>
        {current === 0 ? "Free" : formatCurrency(current, currency)}
      </span>
      {onSale && (
        <span className="text-sm text-muted-foreground line-through tabular-nums">
          {formatCurrency(price, currency)}
        </span>
      )}
      {onSale && showDiscountBadge && percent > 0 && <Badge variant="sale">-{percent}%</Badge>}
    </div>
  );
}
