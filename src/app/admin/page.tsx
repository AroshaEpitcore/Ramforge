import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { OrdersTable } from "@/features/admin/components/orders-table";
import { formatCurrency } from "@/lib/formatters";
import { buildMetadata } from "@/lib/seo";
import { getDashboardStats, listAllOrders } from "@/server/queries/admin-ops";
import { Clapperboard, DollarSign, MessageSquare, Receipt, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Dashboard" });

export default async function AdminDashboardPage() {
  const [stats, orders] = await Promise.all([getDashboardStats(), listAllOrders()]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Store performance at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue (paid)"
          value={formatCurrency(stats.revenue)}
          icon={<DollarSign />}
        />
        <StatCard label="Paid orders" value={stats.paidOrders} icon={<Receipt />} />
        <StatCard label="Customers" value={stats.customers} icon={<Users />} />
        <StatCard label="Published videos" value={stats.publishedVideos} icon={<Clapperboard />} />
      </div>

      {stats.pendingReviews > 0 && (
        <Card>
          <CardContent className="flex items-center gap-3 py-4 text-sm">
            <MessageSquare className="size-4 text-warning" />
            {stats.pendingReviews} review(s) awaiting moderation.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <EmptyState
              icon={<Receipt />}
              title="No orders yet"
              description="Orders will appear here."
            />
          ) : (
            <OrdersTable orders={orders.slice(0, 20)} pageSize={6} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
