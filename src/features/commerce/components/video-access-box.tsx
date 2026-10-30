"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { buyVideo } from "@/features/commerce/actions";
import { CouponField } from "@/features/commerce/components/coupon-field";
import { formatCurrency } from "@/lib/formatters";
import { Check, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function VideoAccessBox({
  videoId,
  price,
  isFree,
  owned,
  paymentsEnabled,
}: {
  videoId: string;
  price: number;
  isFree: boolean;
  owned: boolean;
  paymentsEnabled: boolean;
}) {
  const [consent, setConsent] = useState(false);
  const [buying, setBuying] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [finalPrice, setFinalPrice] = useState<number | null>(null);

  const onBuy = async () => {
    setBuying(true);
    const res = await buyVideo({
      id: videoId,
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
        {isFree ? (
          <>
            <span className="text-3xl font-bold text-success">Free</span>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="size-4 text-success" /> Watch the full video above
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 text-success" /> No account required
              </li>
            </ul>
          </>
        ) : owned ? (
          <>
            <Badge variant="success">You own this video</Badge>
            <p className="text-sm text-muted-foreground">
              Find it any time in your <span className="font-medium">library</span>.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Lock className="size-5 text-muted-foreground" />
              <span className="text-lg font-semibold">Paid video</span>
            </div>
            {paymentsEnabled && price > 0 ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums">
                    {formatCurrency(finalPrice ?? price)}
                  </span>
                  {finalPrice != null && finalPrice < price && (
                    <span className="text-muted-foreground tabular-nums line-through">
                      {formatCurrency(price)}
                    </span>
                  )}
                </div>
                <CouponField
                  kind="video"
                  itemId={videoId}
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
                  Buy now
                </Button>
              </>
            ) : (
              <>
                <Badge variant="muted">Coming soon</Badge>
                <p className="text-sm text-muted-foreground">
                  This video isn’t on sale yet. Join the newsletter to be notified.
                </p>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
