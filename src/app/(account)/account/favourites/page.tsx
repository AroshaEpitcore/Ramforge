import { PageHeader } from "@/components/layout/page-header";
import { VideoGrid } from "@/components/shared/video-grid";
import { buildMetadata } from "@/lib/seo";
import { mockVideos } from "@/mocks";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Favourites" });

export default function FavouritesPage() {
  const favourites = mockVideos.slice(2, 8);
  return (
    <div className="space-y-6">
      <PageHeader title="Favourites" description="Videos you've saved for later." />
      <VideoGrid
        videos={favourites}
        columns={3}
        emptyTitle="No favourites yet"
        emptyDescription="Tap the heart on any video to save it here."
      />
    </div>
  );
}
