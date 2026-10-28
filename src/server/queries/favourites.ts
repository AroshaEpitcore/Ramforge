import "server-only";

import { db } from "@/server/db";
import type { Video } from "@/types";
import { listPublishedVideos } from "@/server/queries/videos";

/** Video ids the user has favourited. */
export async function listFavouriteIds(userId: string): Promise<Set<string>> {
  const rows = await db.favourite.findMany({ where: { userId }, select: { videoId: true } });
  return new Set(rows.map((r) => r.videoId));
}

export async function isFavourited(userId: string, videoId: string): Promise<boolean> {
  const row = await db.favourite.findUnique({
    where: { userId_videoId: { userId, videoId } },
    select: { userId: true },
  });
  return Boolean(row);
}

/** The user's favourited published videos (as storefront view models). */
export async function listUserFavourites(userId: string): Promise<Video[]> {
  const ids = await listFavouriteIds(userId);
  if (ids.size === 0) return [];
  const all = await listPublishedVideos();
  return all.filter((v) => ids.has(v.id));
}
