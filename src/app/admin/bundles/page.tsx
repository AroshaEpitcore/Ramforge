import { PageHeader } from "@/components/layout/page-header";
import { BundleManager } from "@/features/admin/components/bundle-manager";
import { requirePermission } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";
import { listBundlesForAdmin } from "@/server/queries/bundles";
import { listVideoOptions } from "@/server/queries/admin";
import { getCurrentUser } from "@/server/current-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Bundles" });

export default async function AdminBundlesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/bundles");
  requirePermission(user, "bundles:manage");

  const [bundles, videos] = await Promise.all([listBundlesForAdmin(), listVideoOptions()]);

  return (
    <div className="space-y-6">
      <PageHeader title="Bundles" description="Group videos into discounted packs." />
      <BundleManager bundles={bundles} videos={videos} />
    </div>
  );
}
