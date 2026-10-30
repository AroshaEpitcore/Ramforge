import { Container } from "@/components/layout/container";
import { VideoGrid } from "@/components/shared/video-grid";
import { Badge } from "@/components/ui/badge";
import { BundleBuyBox } from "@/features/commerce/components/bundle-buy-box";
import { buildMetadata } from "@/lib/seo";
import { getBundleBySlug } from "@/server/queries/bundles";
import { listPublishedVideos } from "@/server/queries/videos";
import { isPaymentsEnabled } from "@/server/services/settings";
import { Layers } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getBundleBySlug(slug);
  if (!bundle) return buildMetadata({ title: "Bundle not found" });
  return buildMetadata({ title: bundle.title, description: bundle.description });
}

export default async function BundleDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [bundle, allVideos, paymentsEnabled] = await Promise.all([
    getBundleBySlug(slug),
    listPublishedVideos(),
    isPaymentsEnabled(),
  ]);
  if (!bundle) notFound();

  const videos = allVideos.filter((v) => bundle.videoIds.includes(v.id));

  return (
    <Container className="py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          <div className="space-y-2">
            <Badge className="gap-1">
              <Layers className="size-3" />
              {bundle.videoCount} videos
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">{bundle.title}</h1>
            <p className="max-w-3xl text-muted-foreground">{bundle.description}</p>
          </div>
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Included videos</h2>
            <VideoGrid videos={videos} columns={3} emptyTitle="No videos in this bundle yet" />
          </section>
        </div>
        <div className="lg:min-w-0">
          <BundleBuyBox
            bundleId={bundle.id}
            price={bundle.price}
            salePrice={bundle.salePrice ?? null}
            valuePrice={bundle.valuePrice}
            paymentsEnabled={paymentsEnabled}
          />
        </div>
      </div>
    </Container>
  );
}
