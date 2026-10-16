import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ORDER_STATUS_LABELS } from "@/config/constants";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { buildMetadata } from "@/lib/seo";
import { mockOrders } from "@/mocks/admin";
import type { OrderStatus } from "@/types";
import { Download } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Orders" });

const statusVariant: Record<OrderStatus, "success" | "warning" | "destructive" | "muted"> = {
  PAID: "success",
  PENDING: "warning",
  FAILED: "destructive",
  REFUNDED: "muted",
  PARTIALLY_REFUNDED: "warning",
};

export default function OrdersPage() {
  const orders = mockOrders.slice(0, 5);
  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Your purchase history and invoices." />
      <div className="space-y-3">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="flex flex-wrap items-center gap-4 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Order #{order.id}</span>
                  <Badge variant={statusVariant[order.status]}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(order.date)} · {order.items} item(s)
                </p>
              </div>
              <span className="font-semibold tabular-nums">{formatCurrency(order.total)}</span>
              <Button variant="outline" size="sm" leftIcon={<Download />}>
                Invoice
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
