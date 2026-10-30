import { PageHeader } from "@/components/layout/page-header";
import { CouponManager } from "@/features/admin/components/coupon-manager";
import { requirePermission } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";
import { listCouponsForAdmin } from "@/server/queries/admin";
import { getCurrentUser } from "@/server/current-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Coupons" });

export default async function AdminCouponsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/coupons");
  requirePermission(user, "coupons:manage");

  const coupons = await listCouponsForAdmin();

  return (
    <div className="space-y-6">
      <PageHeader title="Coupons" description="Create discount codes for checkout." />
      <CouponManager coupons={coupons} />
    </div>
  );
}
