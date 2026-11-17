import { BundleBanner } from "@/components/home/bundle-banner";
import { CategorySidebar } from "@/components/home/category-sidebar";
import { DonateCard } from "@/components/home/donate-card";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { SectionHeader } from "@/components/home/section-header";
import { FadeIn } from "@/components/motion";
import { CategoryChip } from "@/components/shared/category-chip";
import { VideoGrid } from "@/components/shared/video-grid";
import { buildMetadata } from "@/lib/seo";
import { listStorefrontCategories } from "@/server/queries/categories";
import { listActiveBanners } from "@/server/queries/marketing";
import { listPublishedBundles } from "@/server/queries/bundles";
import { getDonateImageUrl } from "@/server/services/settings";
import { listPublishedVideos } from "@/server/queries/videos";
import { mockBanners, mockBundles } from "@/mocks";
import type { Metadata } from "next";
import { Flame } from "lucide-react";

// Reads the live database, so render per-request (never prerender at build).
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: { absolute: "FrameForge — Learn. Create. Composite." },
});

export default async function HomePage() {
  const [videos, categories, realBanners, realBundles, donateImageUrl] = await Promise.all([
    listPublishedVideos(),
    listStorefrontCategories(),
    listActiveBanners(),
    listPublishedBundles(),
    getDonateImageUrl(),
  ]);
  // Fall back to the sample hero imagery until an admin adds real banners.
  const banners = realBanners.length > 0 ? realBanners : mockBanners.filter((b) => b.active);
  // Fall back to sample bundles until real ones are published.
  const bundles = realBundles.length > 0 ? realBundles : mockBundles;
  const newReleases = videos.slice(0, 8);

  return (
    <div className="mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
        {/* Category rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <CategorySidebar categories={categories} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-12">
          {/* Hero + promo */}
          <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <HeroCarousel banners={banners} />
            <DonateCard href="/support" className="hidden lg:block" imageSrc={donateImageUrl} />
          </section>

          {/* Category chips (mobile + quick browse) */}
          {categories.length > 0 && (
            <div className="-mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {categories.map((c) => (
                <CategoryChip key={c.id} category={c} showCount />
              ))}
            </div>
          )}

          {/* New releases */}
          <section className="flex flex-col gap-4">
            <SectionHeader title="New releases" icon={<Flame />} viewAllHref="/shop?sort=newest" />
            <FadeIn>
              <VideoGrid videos={newReleases} columns={4} />
            </FadeIn>
          </section>

          {/* Bundles — wide promo banner */}
          <BundleBanner bundles={bundles} />
        </div>
      </div>
    </div>
  );
}
