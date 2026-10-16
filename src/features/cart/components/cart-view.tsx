"use client";

import { CartItem } from "@/components/shared/cart-item";
import { AnimatedList, AnimatedListItem } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/formatters";
import { mockCartLines } from "@/mocks";
import { selectCartSubtotal, useCartStore } from "@/stores/cart-store";
import { ArrowRight, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

const TAX_RATE = 0.2; // Demo VAT rate for digital goods.

export function CartView() {
  const lines = useCartStore((s) => s.lines);
  const subtotal = useCartStore(selectCartSubtotal);
  const removeLine = useCartStore((s) => s.removeLine);
  const addLine = useCartStore((s) => s.addLine);

  // Demo-only: seed the cart so the page is reviewable. Remove in production.
  useEffect(() => {
    if (useCartStore.getState().lines.length === 0) {
      mockCartLines.forEach(addLine);
    }
  }, [addLine]);

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart />}
        title="Your cart is empty"
        description="Browse the catalogue and add some videos to get started."
        action={
          <Button asChild>
            <Link href="/shop">Browse videos</Link>
          </Button>
        }
      />
    );
  }

  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardTitle>Cart ({lines.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <AnimatedList>
            {lines.map((line) => (
              <AnimatedListItem key={line.id}>
                <CartItem line={line} onRemove={removeLine} />
              </AnimatedListItem>
            ))}
          </AnimatedList>
        </CardContent>
      </Card>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT (20%)</span>
            <span className="tabular-nums">{formatCurrency(tax)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(total)}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild fullWidth rightIcon={<ArrowRight />}>
            <Link href="/checkout">Checkout</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
