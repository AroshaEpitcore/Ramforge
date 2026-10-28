import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/shared/json-ld";
import { VideoGrid } from "@/components/shared/video-grid";
import { VideoPlayer } from "@/components/shared/video-player";
import { YouTubeEmbed } from "@/components/shared/youtube-embed";
import { Badge } from "@/components/ui/badge";
import { Duration } from "@/components/ui/duration";
import { Rating } from "@/components/ui/rating";
import { Separator } from "@/components/ui/separator";
import { QUALITY_LABELS } from "@/config/constants";
import { siteConfig } from "@/config/site";
import { VideoAccessBox } from "@/features/commerce/components/video-access-box";
import { formatCompactNumber, formatDate, formatFileSize } from "@/lib/formatters";
import { buildMetadata } from "@/lib/seo";
import { ownsVideo } from "@/server/queries/account";
import {
  getPublishedVideoBySlug,
  getRelatedVideos,
  listApprovedReviews,
} from "@/server/queries/videos";
import { getCurrentUser } from "@/server/current-user";
import { isPaymentsEnabled } from "@/server/services/settings";
import type { Video } from "@/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const video = await getPublishedVideoBySlug(slug);
  if (!video) return buildMetadata({ title: "Video not found" });
  return buildMetadata({ title: video.title, description: video.description });
}

export default async function VideoDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const video = await getPublishedVideoBySlug(slug);
  if (!video) notFound();

  const [related, reviews, paymentsEnabled, user] = await Promise.all([
    getRelatedVideos(video),
    listApprovedReviews(video.id),
    isPaymentsEnabled(),
    getCurrentUser(),
  ]);

  const isFree = video.accessMode === "FREE";
  const owned = !isFree && user ? await ownsVideo(user.id, video.id) : false;

  return (
    <Container className="py-8">
      <JsonLd data={videoJsonLd(video)} />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          {isFree && video.source === "YOUTUBE" && video.youtubeId ? (
            <YouTubeEmbed youtubeId={video.youtubeId} title={video.title} />
          ) : (
            <VideoPlayer
              source={{ poster: video.thumbnailUrl || undefined }}
              title={video.title}
              isPreview
            />
          )}

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{video.category.name}</Badge>
              {video.reviewCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Rating value={video.rating} size="sm" />
                  {video.rating.toFixed(1)} ({video.reviewCount})
                </span>
              )}
              <span>·</span>
              <span>{formatCompactNumber(video.viewCount)} views</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{video.title}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Duration seconds={video.durationSec} withIcon />
              </span>
              <span>{QUALITY_LABELS[video.quality]}</span>
              {video.fileSizeBytes && <span>{formatFileSize(video.fileSizeBytes)}</span>}
              {video.publishedAt && <span>Published {formatDate(video.publishedAt)}</span>}
            </div>
          </div>

          <p className="leading-relaxed text-muted-foreground">{video.description}</p>

          {video.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {video.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          <Separator />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{review.author.name}</span>
                      <Rating value={review.rating} size="sm" />
                    </div>
                    {review.title && <p className="mt-1 font-medium">{review.title}</p>}
                    <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="lg:min-w-0">
          <VideoAccessBox
            videoId={video.id}
            price={video.salePrice ?? video.price}
            isFree={isFree}
            owned={owned}
            paymentsEnabled={paymentsEnabled}
          />
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold">Related videos</h2>
          <VideoGrid videos={related} columns={4} />
        </section>
      )}
    </Container>
  );
}

function videoJsonLd(video: Video): Record<string, unknown> {
  const base = siteConfig.url.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl || undefined,
    uploadDate: video.publishedAt,
    url: `${base}/video/${video.slug}`,
    ...(video.source === "YOUTUBE" && video.youtubeId
      ? { embedUrl: `https://www.youtube.com/embed/${video.youtubeId}` }
      : {}),
  };
}
