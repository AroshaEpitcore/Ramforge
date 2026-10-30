import { BundleCard } from "@/components/shared/bundle-card";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/ui/empty-state";
import { buildMetadata } from "@/lib/seo";
import { listPublishedBundles } from "@/server/queries/bundles";
import { Layers } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Bundles",
  description: "Save more with curated video bundles and packs.",
});

export default async function BundlesPage() {
  const bundles = await listPublishedBundles();

  return (
    <Container className="py-8">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Bundles &amp; packs</h1>
        <p className="text-sm text-muted-foreground">
          Buy more, save more. Lifetime access to every video included.
        </p>
      </div>
      {bundles.length === 0 ? (
        <EmptyState
          icon={<Layers />}
          title="No bundles yet"
          description="New bundles are on the way."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </div>
      )}
    </Container>
  );
}
