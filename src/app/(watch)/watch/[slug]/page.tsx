import { Badge } from "@/components/ui/badge";
import { Duration } from "@/components/ui/duration";
import { QUALITY_LABELS } from "@/config/constants";
import { PlaybackPlayer } from "@/features/videos/components/playback-player";
import { buildMetadata } from "@/lib/seo";
import { getPublishedVideoBySlug } from "@/server/queries/videos";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Session- and DB-backed; the player resolves a signed URL per request.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const video = await getPublishedVideoBySlug(slug);
  return buildMetadata({ title: video ? `Watch · ${video.title}` : "Watch" });
}

export default async function WatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const video = await getPublishedVideoBySlug(slug);
  if (!video) notFound();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4">
      <PlaybackPlayer
        videoId={video.id}
        poster={video.thumbnailUrl || undefined}
        title={video.title}
      />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">{video.title}</h1>
        <Badge variant={video.quality === "UHD_4K" ? "4k" : "hd"}>
          {QUALITY_LABELS[video.quality]}
        </Badge>
        <span className="text-sm text-white/60">
          <Duration seconds={video.durationSec} withIcon />
        </span>
      </div>
      <p className="max-w-3xl text-sm text-white/70">{video.description}</p>
    </div>
  );
}
