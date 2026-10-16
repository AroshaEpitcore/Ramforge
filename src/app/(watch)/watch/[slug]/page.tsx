import { VideoPlayer } from "@/components/shared/video-player";
import { Badge } from "@/components/ui/badge";
import { Duration } from "@/components/ui/duration";
import { QUALITY_LABELS } from "@/config/constants";
import { buildMetadata } from "@/lib/seo";
import { getVideoBySlug } from "@/mocks";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const video = getVideoBySlug(slug);
  return buildMetadata({ title: video ? `Watch · ${video.title}` : "Watch" });
}

export default async function WatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const video = getVideoBySlug(slug);
  if (!video) notFound();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4">
      <VideoPlayer
        source={{ poster: video.thumbnailUrl, provider: "mock" }}
        title={video.title}
        className="w-full"
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
