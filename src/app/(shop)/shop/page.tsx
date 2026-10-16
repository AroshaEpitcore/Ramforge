import { CategorySidebar } from "@/components/home/category-sidebar";
import { FilterBar } from "@/components/shared/filter-bar";
import { VideoGrid } from "@/components/shared/video-grid";
import { buildMetadata } from "@/lib/seo";
import { mockVideos } from "@/mocks";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Shop",
  description: "Browse the full catalogue of VFX, compositing and filmmaking videos.",
});

export default function ShopPage() {
  return (
    <div className="mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <CategorySidebar />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">All videos</h1>
            <p className="text-sm text-muted-foreground">
              {mockVideos.length} results · filters and sorting are URL-synced via nuqs.
            </p>
          </div>
          <FilterBar />
          <VideoGrid videos={mockVideos} columns={3} />
        </div>
      </div>
    </div>
  );
}
