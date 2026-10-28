"use server";

import { ForbiddenError, requirePermission } from "@/lib/rbac";
import { db } from "@/server/db";
import { requireCurrentUser } from "@/server/current-user";
import { grantAccess, revokeAccess } from "@/server/services/entitlements";
import type { ActionResult, SessionUser } from "@/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

const grantSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    courseId: z.string().optional(),
    videoId: z.string().optional(),
  })
  .refine((v) => Boolean(v.courseId) !== Boolean(v.videoId), {
    message: "Choose exactly one course or video",
    path: ["courseId"],
  });

async function authorize(
  permission: Parameters<typeof requirePermission>[1],
): Promise<SessionUser> {
  const user = await requireCurrentUser();
  requirePermission(user, permission);
  return user;
}

/** Manually grant a customer access to a course or video (support/staff tool). */
export async function manualGrantAccess(raw: unknown): Promise<ActionResult> {
  const parsed = grantSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(
      "Please fix the highlighted fields.",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }
  const { email, courseId, videoId } = parsed.data;

  try {
    const staff = await authorize("access:grant");

    const target = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (!target) return fail("No customer with that email.", { email: ["Not found."] });

    const res = await grantAccess({
      userId: target.id,
      courseId,
      videoId,
      grantedById: staff.id,
    });
    if (!res.ok) return fail(res.error);

    await db.activityLog.create({
      data: {
        userId: staff.id,
        action: "access.grant",
        entity: courseId ? "Course" : "Video",
        entityId: courseId ?? videoId ?? null,
        metadata: { targetUserId: target.id },
      },
    });
    revalidatePath("/admin/access");
    return { ok: true, data: undefined };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail("You do not have permission.");
    return fail("Could not grant access.");
  }
}

/** Revoke a previously granted entitlement. */
export async function revokeGrant(purchaseId: string): Promise<ActionResult> {
  try {
    const staff = await authorize("access:revoke");
    const res = await revokeAccess(purchaseId);
    if (!res.ok) return fail(res.error);
    await db.activityLog.create({
      data: { userId: staff.id, action: "access.revoke", entity: "Purchase", entityId: purchaseId },
    });
    revalidatePath("/admin/access");
    return { ok: true, data: undefined };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail("You do not have permission.");
    return fail("Could not revoke access.");
  }
}
