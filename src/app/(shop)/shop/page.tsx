import { CategorySidebar } from "@/components/home/category-sidebar";
import { ShopView } from "@/features/shop/components/shop-view";
import { buildMetadata } from "@/lib/seo";
import { listStorefrontCategories } from "@/server/queries/categories";
import { listPublishedVideos } from "@/server/queries/videos";
import type { Metadata } from "next";

// Reads the live database, so render per-request (never prerender at build).
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Shop",
  description: "Browse the full catalogue of VFX, compositing and filmmaking videos.",
});

export default async function ShopPage() {
  const [videos, categories] = await Promise.all([
    listPublishedVideos(),
    listStorefrontCategories(),
  ]);

  return (
    <div className="mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <CategorySidebar categories={categories} />
          </div>
        </aside>
        <ShopView videos={videos} />
      </div>
    </div>
  );
}
