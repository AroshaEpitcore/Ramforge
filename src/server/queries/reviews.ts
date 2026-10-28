import "server-only";

import { db } from "@/server/db";

export interface AdminReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  approved: boolean;
  authorName: string;
  videoTitle: string;
  videoSlug: string;
  createdAt: string;
}

/** All reviews for moderation (pending first, then newest). */
export async function listReviewsForAdmin(): Promise<AdminReviewRow[]> {
  const rows = await db.review.findMany({
    orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      approved: true,
      createdAt: true,
      user: { select: { name: true } },
      video: { select: { title: true, slug: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    approved: r.approved,
    authorName: r.user.name ?? "Customer",
    videoTitle: r.video.title,
    videoSlug: r.video.slug,
    createdAt: r.createdAt.toISOString(),
  }));
}

/** The signed-in user's own review for a video (to prefill the form). */
export async function getUserReview(userId: string, videoId: string) {
  return db.review.findUnique({
    where: { videoId_userId: { videoId, userId } },
    select: { rating: true, title: true, body: true, approved: true },
  });
}
