import { BlogList } from "@/components/home/blog-list";
import { CategorySidebar } from "@/components/home/category-sidebar";
import { DonateCard } from "@/components/home/donate-card";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { SectionHeader } from "@/components/home/section-header";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { BundleCard } from "@/components/shared/bundle-card";
import { CategoryChip } from "@/components/shared/category-chip";
import { VideoCard } from "@/components/shared/video-card";
import { VideoGrid } from "@/components/shared/video-grid";
import { buildMetadata } from "@/lib/seo";
import { listStorefrontCategories } from "@/server/queries/categories";
import { listPublishedVideos } from "@/server/queries/videos";
import { mockBanners, mockBlogPosts, mockBundles } from "@/mocks";
import type { Metadata } from "next";
import { Clapperboard, Flame, Layers, Newspaper } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: { absolute: "FrameForge — Learn. Create. Composite." },
});

export default async function HomePage() {
  const banners = mockBanners.filter((b) => b.active);
  const [videos, categories] = await Promise.all([
    listPublishedVideos(),
    listStorefrontCategories(),
  ]);
  const featured = videos[0];
  const latest = videos.slice(1, 5);
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
            <DonateCard href="/donate" className="hidden lg:flex" />
          </section>

          {/* Category chips (mobile + quick browse) */}
          {categories.length > 0 && (
            <div className="-mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {categories.map((c) => (
                <CategoryChip key={c.id} category={c} showCount />
              ))}
            </div>
          )}

          {/* Featured / Latest / Blog */}
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-3">
              <SectionHeader
                title="Featured"
                icon={<Clapperboard />}
                viewAllHref="/shop?sort=popular"
              />
              {featured ? (
                <VideoCard video={featured} priority />
              ) : (
                <p className="text-sm text-muted-foreground">No videos published yet.</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <SectionHeader title="Latest" icon={<Flame />} viewAllHref="/shop?sort=newest" />
              <div className="grid grid-cols-2 gap-3">
                {latest.map((v) => (
                  <VideoCard key={v.id} video={v} variant="compact" />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <SectionHeader title="On the blog" icon={<Newspaper />} viewAllHref="/blog" />
              <BlogList posts={mockBlogPosts} />
            </div>
          </section>

          {/* New releases */}
          <section className="flex flex-col gap-4">
            <SectionHeader title="New releases" icon={<Flame />} viewAllHref="/shop?sort=newest" />
            <FadeIn>
              <VideoGrid videos={newReleases} columns={4} />
            </FadeIn>
          </section>

          {/* Bundles */}
          <section className="flex flex-col gap-4">
            <SectionHeader title="Save with bundles" icon={<Layers />} viewAllHref="/bundles" />
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mockBundles.map((bundle) => (
                <StaggerItem key={bundle.id}>
                  <BundleCard bundle={bundle} />
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        </div>
      </div>
    </div>
  );
}
