import { AssetCard } from "@/components/shared/asset-card";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/ui/empty-state";
import { buildMetadata } from "@/lib/seo";
import { listPublishedAssets } from "@/server/queries/assets";
import { Package } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Assets",
  description: "Free downloadable assets and resources.",
});

export default async function AssetsPage() {
  const assets = await listPublishedAssets();

  return (
    <Container className="py-8">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Assets &amp; resources</h1>
        <p className="text-sm text-muted-foreground">
          Download free assets, project files and resources.
        </p>
      </div>
      {assets.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title="No assets yet"
          description="Downloadable resources are on the way."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </Container>
  );
}
