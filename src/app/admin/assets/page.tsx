import { PageHeader } from "@/components/layout/page-header";
import { AssetManager } from "@/features/admin/components/asset-manager";
import { requirePermission } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";
import { listAssetsForAdmin } from "@/server/queries/assets";
import { getCurrentUser } from "@/server/current-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Assets" });

export default async function AdminAssetsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/assets");
  requirePermission(user, "assets:manage");

  const assets = await listAssetsForAdmin();

  return (
    <div className="space-y-6">
      <PageHeader title="Assets" description="Downloadable resources shown on the Assets page." />
      <AssetManager assets={assets} />
    </div>
  );
}
