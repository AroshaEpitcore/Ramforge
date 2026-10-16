import { PageHeader } from "@/components/layout/page-header";
import { OrdersTable } from "@/features/admin/components/orders-table";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Orders" });

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Search, filter and manage all orders." />
      <OrdersTable pageSize={10} />
    </div>
  );
}
