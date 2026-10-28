import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency } from "@/lib/formatters";
import { requirePermission } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";
import { getDashboardStats } from "@/server/queries/admin-ops";
import { getCurrentUser } from "@/server/current-user";
import { BookOpen, Clapperboard, DollarSign, Mail, Receipt, RotateCcw, Users } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Reports" });

export default async function AdminReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/reports");
  requirePermission(user, "reports:read");

  const s = await getDashboardStats();
  const refundRate = s.paidOrders > 0 ? Math.round((s.refundedOrders / s.paidOrders) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Key numbers across the store." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue (paid)" value={formatCurrency(s.revenue)} icon={<DollarSign />} />
        <StatCard label="Paid orders" value={s.paidOrders} icon={<Receipt />} />
        <StatCard
          label="Refunds"
          value={`${s.refundedOrders} (${refundRate}%)`}
          icon={<RotateCcw />}
        />
        <StatCard label="Customers" value={s.customers} icon={<Users />} />
        <StatCard label="Published videos" value={s.publishedVideos} icon={<Clapperboard />} />
        <StatCard label="Courses" value={s.courses} icon={<BookOpen />} />
        <StatCard label="Newsletter subscribers" value={s.newsletterSubscribers} icon={<Mail />} />
      </div>
    </div>
  );
}
