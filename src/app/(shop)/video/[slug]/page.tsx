import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/shared/json-ld";
import { VideoGrid } from "@/components/shared/video-grid";
import { VideoPlayer } from "@/components/shared/video-player";
import { YouTubeEmbed } from "@/components/shared/youtube-embed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Duration } from "@/components/ui/duration";
import { Rating } from "@/components/ui/rating";
import { Separator } from "@/components/ui/separator";
import { QUALITY_LABELS } from "@/config/constants";
import { siteConfig } from "@/config/site";
import { formatCompactNumber, formatCurrency, formatDate, formatFileSize } from "@/lib/formatters";
import { buildMetadata } from "@/lib/seo";
import {
  getPublishedVideoBySlug,
  getRelatedVideos,
  listApprovedReviews,
} from "@/server/queries/videos";
import { isPaymentsEnabled } from "@/server/services/settings";
import type { Video } from "@/types";
import { Check, Lock } from "lucide-react";
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

  const [related, reviews, paymentsEnabled] = await Promise.all([
    getRelatedVideos(video),
    listApprovedReviews(video.id),
    isPaymentsEnabled(),
  ]);

  const isFree = video.accessMode === "FREE";

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
          <AccessBox video={video} isFree={isFree} paymentsEnabled={paymentsEnabled} />
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

function AccessBox({
  video,
  isFree,
  paymentsEnabled,
}: {
  video: Video;
  isFree: boolean;
  paymentsEnabled: boolean;
}) {
  const price = video.salePrice ?? video.price;
  return (
    <Card className="lg:sticky lg:top-20">
      <CardContent className="space-y-4">
        {isFree ? (
          <>
            <span className="text-3xl font-bold text-success">Free</span>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="size-4 text-success" /> Watch the full video above
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 text-success" /> No account required
              </li>
            </ul>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Lock className="size-5 text-muted-foreground" />
              <span className="text-lg font-semibold">Paid video</span>
            </div>
            {paymentsEnabled ? (
              <>
                <span className="text-3xl font-bold tabular-nums">{formatCurrency(price)}</span>
                <Button fullWidth disabled>
                  Buy (coming soon)
                </Button>
              </>
            ) : (
              <>
                <Badge variant="muted">Coming soon</Badge>
                <p className="text-sm text-muted-foreground">
                  This video isn’t on sale yet. Join the newsletter to be notified.
                </p>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
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
