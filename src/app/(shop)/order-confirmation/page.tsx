import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { buildMetadata } from "@/lib/seo";
import { db } from "@/server/db";
import { CheckCircle2, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({ title: "Order confirmation" });

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; order?: string }>;
}) {
  const { session_id, order: orderId } = await searchParams;

  const select = {
    id: true,
    status: true,
    total: true,
    _count: { select: { items: true } },
  } as const;
  const order = orderId
    ? await db.order.findUnique({ where: { id: orderId }, select })
    : session_id
      ? await db.order.findFirst({ where: { stripeCheckoutId: session_id }, select })
      : null;

  const paid = order?.status === "PAID";

  return (
    <Container className="max-w-xl py-12">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          {paid ? (
            <CheckCircle2 className="size-12 text-success" />
          ) : (
            <Clock className="size-12 text-muted-foreground" />
          )}
          <h1 className="text-2xl font-semibold">
            {paid ? "Thank you for your purchase!" : "Payment received"}
          </h1>

          {order ? (
            <>
              <p className="text-muted-foreground">
                Order <span className="font-mono">#{order.id.slice(0, 8)}</span> ·{" "}
                {order._count.items} item(s) · {formatCurrency(order.total)}
              </p>
              <p className="text-sm text-muted-foreground">
                {paid
                  ? "Your access is ready — find it in your library."
                  : "We’re confirming your payment. Your library will update in a moment."}
              </p>
              <div className="flex gap-3 pt-2">
                <Button asChild>
                  <Link href="/account/library">Go to My Library</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/account/orders">View orders</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">We couldn’t find that order.</p>
              <Button asChild variant="outline">
                <Link href="/courses">Browse courses</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
