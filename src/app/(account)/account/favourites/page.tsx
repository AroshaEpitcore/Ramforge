import { PageHeader } from "@/components/layout/page-header";
import { VideoGrid } from "@/components/shared/video-grid";
import { buildMetadata } from "@/lib/seo";
import { listUserFavourites } from "@/server/queries/favourites";
import { getCurrentUser } from "@/server/current-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Favourites" });

export default async function FavouritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/account/favourites");

  const videos = await listUserFavourites(user.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Favourites" description="Videos you've saved for later." />
      <VideoGrid
        videos={videos}
        columns={3}
        emptyTitle="No favourites yet"
        emptyDescription="Tap the heart on any video to save it here."
      />
    </div>
  );
}
