"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ENTITLEMENT_LABELS } from "@/config/constants";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import type { Video } from "@/types";
import { Check, Heart, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function BuyBox({ video }: { video: Video }) {
  const options = video.purchaseOptions;
  const [selected, setSelected] = useState(options[0]?.type ?? "STREAM");
  const [faved, setFaved] = useState(false);
  const addLine = useCartStore((s) => s.addLine);

  const option = options.find((o) => o.type === selected) ?? options[0];
  const price = option?.salePrice ?? option?.price ?? 0;

  const addToCart = () => {
    addLine({
      id: `${video.id}-${selected}`,
      kind: "video",
      refId: video.id,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl,
      option: selected,
      rentalDays: option?.rentalDays,
      unitPrice: price,
      quantity: 1,
    });
    toast.success("Added to cart", { description: video.title });
  };

  return (
    <Card className="lg:sticky lg:top-20">
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums">
            {price === 0 ? "Free" : formatCurrency(price)}
          </span>
          {option?.salePrice != null && option.salePrice < option.price && (
            <span className="text-muted-foreground line-through tabular-nums">
              {formatCurrency(option.price)}
            </span>
          )}
        </div>

        {options.length > 1 && (
          <RadioGroup
            value={selected}
            onValueChange={(v) => setSelected(v as typeof selected)}
            className="gap-2"
          >
            {options.map((opt) => (
              <label
                key={opt.type}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors",
                  selected === opt.type ? "border-primary bg-primary/5" : "hover:bg-accent/50",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <RadioGroupItem value={opt.type} />
                  {ENTITLEMENT_LABELS[opt.type]}
                  {opt.type === "RENTAL" && opt.rentalDays && (
                    <span className="text-xs text-muted-foreground">({opt.rentalDays} days)</span>
                  )}
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(opt.salePrice ?? opt.price)}
                </span>
              </label>
            ))}
          </RadioGroup>
        )}

        <div className="flex gap-2">
          <Button fullWidth onClick={addToCart} leftIcon={<ShoppingCart />}>
            Add to cart
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-pressed={faved}
            aria-label="Add to favourites"
            onClick={() => setFaved((f) => !f)}
          >
            <Heart className={cn("size-4", faved && "fill-destructive text-destructive")} />
          </Button>
        </div>

        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Check className="size-4 text-success" /> Lifetime access (purchases)
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-success" /> Secure streaming player
          </li>
          {video.allowDownload && (
            <li className="flex items-center gap-2">
              <Check className="size-4 text-success" /> Downloadable project files
            </li>
          )}
        </ul>

        <div className="flex flex-wrap gap-1 pt-1">
          <Badge variant={video.quality === "UHD_4K" ? "4k" : "hd"}>
            {video.quality === "UHD_4K" ? "4K" : "HD"}
          </Badge>
          {video.isNew && <Badge variant="new">New</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}
