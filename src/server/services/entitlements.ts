import "server-only";

import { CONCURRENT_DEVICE_LIMIT } from "@/config/constants";
import { db } from "@/server/db";
import type { AccessMode, ActionResult, EntitlementType } from "@/types";

/**
 * Entitlement service — decides what a user may do with a video and manages
 * manual grants/revocations. Stub implementations: the access-decision helpers
 * are real (pure functions), the persistence helpers are stubs to wire to
 * Prisma (`db.purchase`, `db.watchSession`).
 */

export interface Entitlement {
  id: string;
  userId: string;
  videoId: string;
  type: EntitlementType;
  expiresAt?: Date | null;
  downloadCount: number;
  downloadLimit?: number | null;
  revokedAt?: Date | null;
}

export interface AccessDecision {
  allowed: boolean;
  reason?: string;
}

const ALLOWED: AccessDecision = { allowed: true };

/** True if a rental entitlement has passed its expiry. */
export function isRentalExpired(entitlement: Pick<Entitlement, "type" | "expiresAt">): boolean {
  if (entitlement.type !== "RENTAL" || !entitlement.expiresAt) return false;
  return entitlement.expiresAt.getTime() < Date.now();
}

/** Can the user stream this video? */
export function canWatch(
  entitlement: Entitlement | null | undefined,
  opts?: { activeSessions?: number },
): AccessDecision {
  if (!entitlement) return { allowed: false, reason: "NO_ENTITLEMENT" };
  if (entitlement.revokedAt) return { allowed: false, reason: "REVOKED" };
  if (isRentalExpired(entitlement)) return { allowed: false, reason: "RENTAL_EXPIRED" };
  if ((opts?.activeSessions ?? 0) >= CONCURRENT_DEVICE_LIMIT) {
    return { allowed: false, reason: "DEVICE_LIMIT_REACHED" };
  }
  return ALLOWED;
}

/** Can the user download this video? */
export function canDownload(entitlement: Entitlement | null | undefined): AccessDecision {
  if (!entitlement) return { allowed: false, reason: "NO_ENTITLEMENT" };
  if (entitlement.revokedAt) return { allowed: false, reason: "REVOKED" };
  if (entitlement.type !== "DOWNLOAD") return { allowed: false, reason: "DOWNLOAD_NOT_ALLOWED" };
  if (isRentalExpired(entitlement)) return { allowed: false, reason: "RENTAL_EXPIRED" };
  if (
    typeof entitlement.downloadLimit === "number" &&
    entitlement.downloadCount >= entitlement.downloadLimit
  ) {
    return { allowed: false, reason: "DOWNLOAD_LIMIT_REACHED" };
  }
  return ALLOWED;
}

/**
 * The single MVP access rule (ARCHITECTURE.md "MVP scope at a glance"):
 *
 *   canWatch = video is FREE
 *           || user owns the video       (Purchase.videoId)
 *           || user owns the video's course (Purchase.courseId)
 *           (and the purchase is not revoked / expired)
 *
 * Pure function — the caller supplies the user's entitlements. FREE videos need
 * no entitlement (and no sign-in).
 */
export interface VideoAccessInput {
  accessMode: AccessMode;
  videoId: string;
  courseId?: string | null;
}

export interface OwnedEntitlement {
  videoId?: string | null;
  courseId?: string | null;
  type: EntitlementType;
  expiresAt?: Date | null;
  revokedAt?: Date | null;
}

export function resolveVideoAccess(
  video: VideoAccessInput,
  entitlements: OwnedEntitlement[],
): AccessDecision {
  if (video.accessMode === "FREE") return ALLOWED;

  const now = Date.now();
  const owns = entitlements.some((e) => {
    if (e.revokedAt) return false;
    if (e.expiresAt && e.expiresAt.getTime() < now) return false;
    if (e.videoId && e.videoId === video.videoId) return true;
    if (e.courseId && video.courseId && e.courseId === video.courseId) return true;
    return false;
  });

  return owns ? ALLOWED : { allowed: false, reason: "NO_ENTITLEMENT" };
}

export interface GrantAccessInput {
  userId: string;
  /** Grant for exactly one of a single video OR a whole course. */
  videoId?: string;
  courseId?: string;
  type?: EntitlementType;
  orderId?: string;
  rentalDays?: number;
  downloadLimit?: number;
  /** Staff user id when granting manually. */
  grantedById?: string;
}

/**
 * Grant an entitlement — from a paid order or a manual staff grant. Idempotent
 * on (user, video|course, type): re-granting refreshes the order link / expiry
 * and clears any previous revocation.
 */
export async function grantAccess(input: GrantAccessInput): Promise<ActionResult<{ id: string }>> {
  const type = input.type ?? "STREAM";
  if (!input.videoId && !input.courseId) {
    return { ok: false, error: "A video or course is required." };
  }
  const expiresAt =
    input.rentalDays && input.rentalDays > 0
      ? new Date(Date.now() + input.rentalDays * 24 * 60 * 60 * 1000)
      : null;

  const base = {
    userId: input.userId,
    type,
    orderId: input.orderId ?? null,
    expiresAt,
    downloadLimit: input.downloadLimit ?? null,
    grantedById: input.grantedById ?? null,
    revokedAt: null,
  };

  try {
    const row = input.courseId
      ? await db.purchase.upsert({
          where: { userId_courseId_type: { userId: input.userId, courseId: input.courseId, type } },
          update: { orderId: base.orderId, expiresAt, revokedAt: null },
          create: { ...base, courseId: input.courseId },
          select: { id: true },
        })
      : await db.purchase.upsert({
          where: { userId_videoId_type: { userId: input.userId, videoId: input.videoId!, type } },
          update: { orderId: base.orderId, expiresAt, revokedAt: null },
          create: { ...base, videoId: input.videoId },
          select: { id: true },
        });
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not grant access." };
  }
}

/**
 * Grant every entitlement for a paid order — expanding bundles into their member
 * videos. Idempotent (grantAccess upserts), so safe to call on webhook retries.
 */
export async function grantOrderAccess(orderId: string): Promise<ActionResult> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      userId: true,
      items: {
        select: { courseId: true, videoId: true, bundleId: true, type: true, rentalDays: true },
      },
    },
  });
  if (!order) return { ok: false, error: "Order not found." };

  for (const item of order.items) {
    const common = {
      userId: order.userId,
      orderId,
      type: item.type,
      rentalDays: item.rentalDays ?? undefined,
    };
    if (item.courseId) {
      await grantAccess({ ...common, courseId: item.courseId });
    } else if (item.videoId) {
      await grantAccess({ ...common, videoId: item.videoId });
    } else if (item.bundleId) {
      const members = await db.bundleVideo.findMany({
        where: { bundleId: item.bundleId },
        select: { videoId: true },
      });
      for (const m of members) await grantAccess({ ...common, videoId: m.videoId, type: "STREAM" });
    }
  }
  return { ok: true, data: undefined };
}

/** Revoke a single entitlement and end its active watch sessions. */
export async function revokeAccess(purchaseId: string): Promise<ActionResult> {
  try {
    const purchase = await db.purchase.findUnique({
      where: { id: purchaseId },
      select: { userId: true, videoId: true },
    });
    await db.purchase.update({ where: { id: purchaseId }, data: { revokedAt: new Date() } });
    if (purchase?.videoId) {
      await db.watchSession.updateMany({
        where: { userId: purchase.userId, videoId: purchase.videoId, endedAt: null },
        data: { endedAt: new Date() },
      });
    }
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not revoke access." };
  }
}

/** Revoke every entitlement granted by an order (e.g. on refund). */
export async function revokeOrderAccess(orderId: string): Promise<ActionResult> {
  try {
    const purchases = await db.purchase.findMany({ where: { orderId }, select: { id: true } });
    for (const p of purchases) await revokeAccess(p.id);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not revoke order access." };
  }
}
