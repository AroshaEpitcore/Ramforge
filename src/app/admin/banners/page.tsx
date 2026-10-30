import { PageHeader } from "@/components/layout/page-header";
import { BannerManager } from "@/features/admin/components/banner-manager";
import { requirePermission } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";
import { listBannersForAdmin } from "@/server/queries/marketing";
import { getCurrentUser } from "@/server/current-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Banners" });

export default async function AdminBannersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/banners");
  requirePermission(user, "banners:manage");

  const banners = await listBannersForAdmin();

  return (
    <div className="space-y-6">
      <PageHeader title="Banners" description="Homepage hero banners." />
      <BannerManager banners={banners} />
    </div>
  );
}
