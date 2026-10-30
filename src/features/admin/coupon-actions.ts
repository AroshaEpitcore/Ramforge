"use server";

import { couponSchema } from "@/features/admin/schemas";
import { ForbiddenError, requirePermission } from "@/lib/rbac";
import { db } from "@/server/db";
import { requireCurrentUser } from "@/server/current-user";
import { normaliseCode } from "@/server/services/coupons";
import type { ActionResult } from "@/types";
import { Prisma } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

async function authorize() {
  requirePermission(await requireCurrentUser(), "coupons:manage");
}

export async function saveCoupon(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = couponSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(
      "Please fix the highlighted fields.",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }
  const d = parsed.data;
  try {
    await authorize();
    const amount =
      d.type === "PERCENT" ? Math.min(100, Math.round(d.amount)) : Math.round(d.amount * 100);
    const data = {
      code: normaliseCode(d.code),
      type: d.type,
      amount,
      active: d.active,
      maxRedemptions: d.maxRedemptions > 0 ? d.maxRedemptions : null,
      expiresAt: d.expiresAt && d.expiresAt.trim() ? new Date(d.expiresAt) : null,
    };
    const row = d.id
      ? await db.coupon.update({ where: { id: d.id }, data })
      : await db.coupon.create({ data });
    revalidatePath("/admin/coupons");
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail("You do not have permission.");
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("That code is already in use.", { code: ["Already in use."] });
    }
    return fail("Could not save the coupon.");
  }
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
  try {
    await authorize();
    await db.coupon.delete({ where: { id } });
    revalidatePath("/admin/coupons");
    return { ok: true, data: undefined };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail("You do not have permission.");
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return fail("This coupon is attached to orders and can't be deleted.");
    }
    return fail("Could not delete the coupon.");
  }
}
