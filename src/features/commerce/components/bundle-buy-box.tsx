"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Price } from "@/components/ui/price";
import { buyBundle } from "@/features/commerce/actions";
import { CouponField } from "@/features/commerce/components/coupon-field";
import { formatCurrency } from "@/lib/formatters";
import { useState } from "react";
import { toast } from "sonner";

export function BundleBuyBox({
  bundleId,
  price,
  salePrice,
  valuePrice,
  paymentsEnabled,
}: {
  bundleId: string;
  price: number;
  salePrice: number | null;
  valuePrice: number;
  paymentsEnabled: boolean;
}) {
  const listPrice = salePrice ?? price;
  const [consent, setConsent] = useState(false);
  const [buying, setBuying] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [finalPrice, setFinalPrice] = useState<number | null>(null);

  const onBuy = async () => {
    setBuying(true);
    const res = await buyBundle({
      id: bundleId,
      waiverConsent: true,
      couponCode: couponCode ?? undefined,
    });
    setBuying(false);
    if (!res.ok) {
      toast.error("Could not start checkout", { description: res.error });
      return;
    }
    window.location.href = res.data.url;
  };

  return (
    <Card className="lg:sticky lg:top-20">
      <CardContent className="space-y-4">
        {finalPrice != null && finalPrice < listPrice ? (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums">{formatCurrency(finalPrice)}</span>
            <span className="text-muted-foreground tabular-nums line-through">
              {formatCurrency(listPrice)}
            </span>
          </div>
        ) : (
          <Price price={valuePrice} salePrice={listPrice} size="lg" showDiscountBadge />
        )}

        {paymentsEnabled ? (
          <>
            <CouponField
              kind="bundle"
              itemId={bundleId}
              onApplied={(c, fp) => {
                setCouponCode(c);
                setFinalPrice(fp);
              }}
            />
            <Label className="items-start gap-2 font-normal">
              <Checkbox
                className="mt-0.5"
                checked={consent}
                onCheckedChange={(v) => setConsent(Boolean(v))}
              />
              <span className="text-xs text-muted-foreground">
                I agree my access begins immediately and I waive my 14-day right to cancel.
              </span>
            </Label>
            <Button fullWidth disabled={!consent || buying} loading={buying} onClick={onBuy}>
              Buy bundle
            </Button>
          </>
        ) : (
          <Badge variant="muted">Coming soon</Badge>
        )}
      </CardContent>
    </Card>
  );
}
