import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { dashboardStats } from "@/mocks/admin";
import { formatCurrency } from "@/lib/formatters";
import { buildMetadata } from "@/lib/seo";
import { OrdersTable } from "@/features/admin/components/orders-table";
import { DollarSign, Receipt, TrendingDown, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Dashboard" });

export default function AdminDashboardPage() {
  const s = dashboardStats;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Store performance at a glance."
        actions={<Button size="sm">Export report</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatCurrency(s.revenue)}
          delta={s.revenueDelta}
          icon={<DollarSign />}
        />
        <StatCard label="Orders" value={s.orders} delta={s.ordersDelta} icon={<Receipt />} />
        <StatCard label="Customers" value={s.customers} delta={s.customersDelta} icon={<Users />} />
        <StatCard
          label="Refund rate"
          value={`${s.refundRate}%`}
          delta={s.refundRateDelta}
          icon={<TrendingDown />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
        </CardHeader>
        <CardContent>
          <OrdersTable pageSize={6} />
        </CardContent>
      </Card>
    </div>
  );
}
