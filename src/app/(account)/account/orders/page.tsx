import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ORDER_STATUS_LABELS } from "@/config/constants";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { buildMetadata } from "@/lib/seo";
import { listUserOrders } from "@/server/queries/account";
import { getCurrentUser } from "@/server/current-user";
import type { OrderStatus } from "@/types";
import { Receipt } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Orders" });

const statusVariant: Record<OrderStatus, "success" | "warning" | "destructive" | "muted"> = {
  PAID: "success",
  PENDING: "warning",
  FAILED: "destructive",
  REFUNDED: "muted",
  PARTIALLY_REFUNDED: "warning",
};

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/account/orders");

  const orders = await listUserOrders(user.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Your purchase history." />
      {orders.length === 0 ? (
        <EmptyState
          icon={<Receipt />}
          title="No orders yet"
          description="Your purchases will appear here."
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="flex flex-wrap items-center gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Order #{order.id.slice(0, 8)}</span>
                    <Badge variant={statusVariant[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(order.date)} · {order.itemCount} item(s)
                  </p>
                </div>
                <span className="font-semibold tabular-nums">{formatCurrency(order.total)}</span>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/account/orders/${order.id}/invoice`}>Invoice</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
