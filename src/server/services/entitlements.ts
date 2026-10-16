import "server-only";

import { CONCURRENT_DEVICE_LIMIT } from "@/config/constants";
import type { ActionResult, EntitlementType } from "@/types";

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

export interface GrantAccessInput {
  userId: string;
  videoId: string;
  type: EntitlementType;
  rentalDays?: number;
  downloadLimit?: number;
  /** Staff user id when granting manually. */
  grantedById?: string;
}

/** Grant access manually or as a result of a successful order (stub). */
export async function grantAccess(_input: GrantAccessInput): Promise<ActionResult<{ id: string }>> {
  // TODO: upsert a Purchase row in the DB; compute expiresAt from rentalDays.
  return { ok: true, data: { id: "stub_entitlement" } };
}

/** Revoke access, e.g. after a refund (stub). */
export async function revokeAccess(
  _entitlementId: string,
  _reason: "REFUND" | "MANUAL" | "ABUSE" = "MANUAL",
): Promise<ActionResult> {
  // TODO: set revokedAt on the Purchase row and end active WatchSessions.
  return { ok: true, data: undefined };
}
