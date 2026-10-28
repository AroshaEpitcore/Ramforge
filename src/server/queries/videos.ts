import "server-only";

import { db } from "@/server/db";
import type { PurchaseOption, Video } from "@/types";

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function publishedWhere(now = new Date()) {
  return {
    status: "PUBLISHED" as const,
    OR: [{ publishAt: null }, { publishAt: { lte: now } }],
  };
}

type VideoRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  tags: string[];
  thumbnailUrl: string | null;
  source: "MUX" | "YOUTUBE";
  youtubeId: string | null;
  previewAssetId: string | null;
  fullAssetId: string | null;
  durationSec: number;
  quality: "SD" | "HD" | "UHD_4K";
  fileSizeBytes: bigint | null;
  price: number;
  salePrice: number | null;
  accessMode: "FREE" | "PAID" | "MEMBERS";
  allowDownload: boolean;
  rentalDays: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  viewCount: number;
  publishedAt: Date | null;
  category: { id: string; name: string; slug: string };
};

const SELECT = {
  id: true,
  title: true,
  slug: true,
  description: true,
  tags: true,
  thumbnailUrl: true,
  source: true,
  youtubeId: true,
  previewAssetId: true,
  fullAssetId: true,
  durationSec: true,
  quality: true,
  fileSizeBytes: true,
  price: true,
  salePrice: true,
  accessMode: true,
  allowDownload: true,
  rentalDays: true,
  status: true,
  viewCount: true,
  publishedAt: true,
  category: { select: { id: true, name: true, slug: true } },
} as const;

function purchaseOptions(v: VideoRow): PurchaseOption[] {
  if (v.accessMode === "FREE") return [];
  const opts: PurchaseOption[] = [{ type: "STREAM", price: v.price, salePrice: v.salePrice }];
  if (v.allowDownload) opts.push({ type: "DOWNLOAD", price: v.price, salePrice: v.salePrice });
  if (v.rentalDays) {
    opts.push({ type: "RENTAL", price: v.price, salePrice: v.salePrice, rentalDays: v.rentalDays });
  }
  return opts;
}

function toVideo(v: VideoRow, agg?: { avg: number; count: number }): Video {
  const youtubeThumb = v.youtubeId ? `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg` : "";
  return {
    id: v.id,
    title: v.title,
    slug: v.slug,
    description: v.description,
    tags: v.tags,
    category: v.category,
    thumbnailUrl: v.thumbnailUrl ?? youtubeThumb,
    source: v.source,
    youtubeId: v.youtubeId,
    previewAssetId: v.previewAssetId ?? undefined,
    fullAssetId: v.fullAssetId ?? undefined,
    durationSec: v.durationSec,
    quality: v.quality,
    fileSizeBytes: v.fileSizeBytes ? Number(v.fileSizeBytes) : undefined,
    price: v.price,
    salePrice: v.salePrice,
    accessMode: v.accessMode,
    allowDownload: v.allowDownload,
    rentalDays: v.rentalDays ?? undefined,
    status: v.status,
    purchaseOptions: purchaseOptions(v),
    rating: agg?.avg ?? 0,
    reviewCount: agg?.count ?? 0,
    viewCount: v.viewCount,
    publishedAt: v.publishedAt ? v.publishedAt.toISOString() : undefined,
    isNew: v.publishedAt ? Date.now() - v.publishedAt.getTime() < NEW_WINDOW_MS : false,
  };
}

/** Approved-review aggregates (avg rating + count) keyed by video id. */
async function reviewAggregates(videoIds: string[]) {
  if (videoIds.length === 0) return new Map<string, { avg: number; count: number }>();
  const rows = await db.review.groupBy({
    by: ["videoId"],
    where: { videoId: { in: videoIds }, approved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.videoId, { avg: r._avg.rating ?? 0, count: r._count._all }]));
}

/** All published videos for the shop grid (newest first). */
export async function listPublishedVideos(): Promise<Video[]> {
  const rows = (await db.video.findMany({
    where: publishedWhere(),
    orderBy: { publishedAt: "desc" },
    select: SELECT,
  })) as VideoRow[];
  const agg = await reviewAggregates(rows.map((r) => r.id));
  return rows.map((r) => toVideo(r, agg.get(r.id)));
}

/** A single published video by slug. */
export async function getPublishedVideoBySlug(slug: string): Promise<Video | null> {
  const row = (await db.video.findUnique({ where: { slug }, select: SELECT })) as VideoRow | null;
  if (!row || row.status !== "PUBLISHED") return null;
  const agg = await reviewAggregates([row.id]);
  return toVideo(row, agg.get(row.id));
}

/** Up to `limit` other published videos in the same category. */
export async function getRelatedVideos(video: Video, limit = 4): Promise<Video[]> {
  const rows = (await db.video.findMany({
    where: { ...publishedWhere(), categoryId: video.category.id, id: { not: video.id } },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: SELECT,
  })) as VideoRow[];
  const agg = await reviewAggregates(rows.map((r) => r.id));
  return rows.map((r) => toVideo(r, agg.get(r.id)));
}

/** Approved reviews for a video (for the detail page). */
export async function listApprovedReviews(videoId: string) {
  const rows = await db.review.findMany({
    where: { videoId, approved: true },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      createdAt: true,
      user: { select: { name: true, image: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title ?? undefined,
    body: r.body,
    author: { name: r.user.name ?? "Customer", avatarUrl: r.user.image ?? undefined },
    createdAt: r.createdAt.toISOString(),
  }));
}

/** All published video slugs (sitemap). */
export async function listPublishedVideoSlugs(): Promise<string[]> {
  const rows = await db.video.findMany({ where: publishedWhere(), select: { slug: true } });
  return rows.map((r) => r.slug);
}
