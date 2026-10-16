import { Container } from "@/components/layout/container";
import { PlaceholderPage } from "@/components/shared/placeholder";
import { VideoGrid } from "@/components/shared/video-grid";
import { buildMetadata } from "@/lib/seo";
import { getBundleBySlug, mockVideos } from "@/mocks";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const bundle = getBundleBySlug(slug);
  return buildMetadata({ title: bundle?.title ?? "Bundle" });
}

export default async function BundleDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bundle = getBundleBySlug(slug);
  if (!bundle) notFound();

  const videos = mockVideos.filter((v) => bundle.videoIds.includes(v.id));

  return (
    <Container className="py-8">
      <PlaceholderPage
        title={bundle.title}
        description={bundle.description}
        note="The full bundle detail page (pricing, savings breakdown, add-to-cart) is built on top of this scaffold."
        backHref="/bundles"
        backLabel="All bundles"
      >
        <div className="mt-2">
          <h2 className="mb-4 text-lg font-semibold">Included videos</h2>
          <VideoGrid videos={videos} columns={4} />
        </div>
      </PlaceholderPage>
    </Container>
  );
}
