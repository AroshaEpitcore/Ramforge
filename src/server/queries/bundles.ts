import "server-only";

import { db } from "@/server/db";
import type { Bundle } from "@/types";

const PUBLISHED = { status: "PUBLISHED" as const };

type BundleWithVideos = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  price: number;
  salePrice: number | null;
  videos: {
    video: {
      id: string;
      thumbnailUrl: string | null;
      youtubeId: string | null;
      price: number;
      salePrice: number | null;
    };
  }[];
};

function ytThumb(id: string | null) {
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
}

function toBundle(b: BundleWithVideos): Bundle {
  const members = b.videos.map((bv) => bv.video);
  const valuePrice = members.reduce((sum, v) => sum + (v.salePrice ?? v.price), 0);
  const thumbnailUrl =
    b.thumbnailUrl ?? members[0]?.thumbnailUrl ?? ytThumb(members[0]?.youtubeId ?? null);
  return {
    id: b.id,
    title: b.title,
    slug: b.slug,
    description: b.description,
    thumbnailUrl,
    videoIds: members.map((v) => v.id),
    videoCount: members.length,
    price: b.price,
    salePrice: b.salePrice,
    valuePrice,
  };
}

const INCLUDE = {
  videos: {
    orderBy: { position: "asc" as const },
    select: {
      video: {
        select: { id: true, thumbnailUrl: true, youtubeId: true, price: true, salePrice: true },
      },
    },
  },
};

export async function listPublishedBundles(): Promise<Bundle[]> {
  const rows = (await db.bundle.findMany({
    where: PUBLISHED,
    orderBy: { createdAt: "desc" },
    include: INCLUDE,
  })) as unknown as BundleWithVideos[];
  return rows.map(toBundle);
}

export async function getBundleBySlug(slug: string): Promise<Bundle | null> {
  const row = (await db.bundle.findUnique({
    where: { slug },
    include: INCLUDE,
  })) as unknown as (BundleWithVideos & { status: string; publishAt: Date | null }) | null;
  if (!row || row.status !== "PUBLISHED") return null;
  return toBundle(row);
}

export async function listPublishedBundleSlugs(): Promise<string[]> {
  const rows = await db.bundle.findMany({ where: PUBLISHED, select: { slug: true } });
  return rows.map((r) => r.slug);
}

export interface AdminBundleRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  price: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  videoCount: number;
  videoIds: string[];
}

export async function listBundlesForAdmin(): Promise<AdminBundleRow[]> {
  const rows = await db.bundle.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      price: true,
      status: true,
      videos: { orderBy: { position: "asc" }, select: { videoId: true } },
    },
  });
  return rows.map((b) => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
    description: b.description,
    thumbnailUrl: b.thumbnailUrl,
    price: b.price,
    status: b.status,
    videoCount: b.videos.length,
    videoIds: b.videos.map((v) => v.videoId),
  }));
}
