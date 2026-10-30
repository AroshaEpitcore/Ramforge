"use server";

import { ForbiddenError, requirePermission } from "@/lib/rbac";
import { db } from "@/server/db";
import { requireCurrentUser } from "@/server/current-user";
import type { ActionResult, Role } from "@/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ROLES: Role[] = [
  "SUPER_ADMIN",
  "STORE_MANAGER",
  "CONTENT_UPLOADER",
  "SUPPORT_STAFF",
  "CUSTOMER",
];

const schema = z.object({
  userId: z.string().min(1),
  role: z.enum(ROLES as [Role, ...Role[]]),
});

function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

/** Change a user's role (Super Admin only). You can't change your own role. */
export async function updateUserRole(raw: unknown): Promise<ActionResult> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return fail("Invalid request.");
  const { userId, role } = parsed.data;
  try {
    const staff = await requireCurrentUser();
    requirePermission(staff, "roles:manage");
    if (userId === staff.id) return fail("You can't change your own role.");

    await db.user.update({ where: { id: userId }, data: { role } });
    await db.activityLog.create({
      data: {
        userId: staff.id,
        action: "user.role_change",
        entity: "User",
        entityId: userId,
        metadata: { role },
      },
    });
    revalidatePath("/admin/users");
    return { ok: true, data: undefined };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail("You do not have permission.");
    return fail("Could not update the role.");
  }
}
