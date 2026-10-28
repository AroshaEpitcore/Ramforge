import "server-only";

import { db } from "@/server/db";

export interface LibraryCourse {
  purchaseId: string;
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  grantedAt: string;
}
export interface LibraryVideo {
  purchaseId: string;
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  grantedAt: string;
  expiresAt: string | null;
}

/** Courses and videos the user currently owns (not revoked / not expired). */
export async function listUserLibrary(
  userId: string,
): Promise<{ courses: LibraryCourse[]; videos: LibraryVideo[] }> {
  const now = new Date();
  const purchases = await db.purchase.findMany({
    where: {
      userId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
      course: { select: { id: true, title: true, slug: true, thumbnailUrl: true } },
      video: { select: { id: true, title: true, slug: true, thumbnailUrl: true } },
    },
  });

  const courses: LibraryCourse[] = [];
  const videos: LibraryVideo[] = [];
  for (const p of purchases) {
    if (p.course) {
      courses.push({
        purchaseId: p.id,
        id: p.course.id,
        title: p.course.title,
        slug: p.course.slug,
        thumbnailUrl: p.course.thumbnailUrl,
        grantedAt: p.createdAt.toISOString(),
      });
    } else if (p.video) {
      videos.push({
        purchaseId: p.id,
        id: p.video.id,
        title: p.video.title,
        slug: p.video.slug,
        thumbnailUrl: p.video.thumbnailUrl,
        grantedAt: p.createdAt.toISOString(),
        expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
      });
    }
  }
  return { courses, videos };
}

export interface AccountOrderRow {
  id: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  total: number;
  currency: string;
  itemCount: number;
  date: string;
}

/** The user's orders (newest first). */
export async function listUserOrders(userId: string): Promise<AccountOrderRow[]> {
  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      total: true,
      currency: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });
  return orders.map((o) => ({
    id: o.id,
    status: o.status,
    total: o.total,
    currency: o.currency,
    itemCount: o._count.items,
    date: o.createdAt.toISOString(),
  }));
}

/** True if the user owns the given course (active entitlement). */
export async function ownsCourse(userId: string, courseId: string): Promise<boolean> {
  const now = new Date();
  const row = await db.purchase.findFirst({
    where: {
      userId,
      courseId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { id: true },
  });
  return Boolean(row);
}

/** True if the user owns the given video directly (active entitlement). */
export async function ownsVideo(userId: string, videoId: string): Promise<boolean> {
  const now = new Date();
  const row = await db.purchase.findFirst({
    where: {
      userId,
      videoId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { id: true },
  });
  return Boolean(row);
}
