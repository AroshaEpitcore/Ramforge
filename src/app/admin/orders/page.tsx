import { PageHeader } from "@/components/layout/page-header";
import { OrdersTable } from "@/features/admin/components/orders-table";
import { requirePermission } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";
import { listAllOrders } from "@/server/queries/admin-ops";
import { getCurrentUser } from "@/server/current-user";
import { EmptyState } from "@/components/ui/empty-state";
import { Receipt } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Orders" });

export default async function AdminOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/orders");
  requirePermission(user, "orders:read");

  const orders = await listAllOrders();

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="All customer orders." />
      {orders.length === 0 ? (
        <EmptyState
          icon={<Receipt />}
          title="No orders yet"
          description="Orders will appear here."
        />
      ) : (
        <OrdersTable orders={orders} pageSize={10} />
      )}
    </div>
  );
}
