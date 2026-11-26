"use server";

import { assetSchema } from "@/features/admin/schemas";
import { ForbiddenError, requirePermission } from "@/lib/rbac";
import { slugify } from "@/lib/slug";
import { db } from "@/server/db";
import { requireCurrentUser } from "@/server/current-user";
import type { ActionResult } from "@/types";
import { Prisma } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

const nullify = (v?: string | null) => (v && v.trim() ? v.trim() : null);

async function authorize() {
  requirePermission(await requireCurrentUser(), "assets:manage");
}

export async function saveAsset(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = assetSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(
      "Please fix the highlighted fields.",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }
  const d = parsed.data;
  try {
    await authorize();
    const data = {
      title: d.title,
      slug: slugify(d.slug || d.title),
      description: nullify(d.description),
      thumbnailUrl: nullify(d.thumbnailUrl),
      externalUrl: nullify(d.externalUrl),
      fileUrl: nullify(d.fileUrl),
      status: d.status,
      position: d.position,
    };
    const row = d.id
      ? await db.asset.update({ where: { id: d.id }, data })
      : await db.asset.create({ data });

    revalidatePath("/admin/assets");
    revalidatePath("/assets");
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail("You do not have permission.");
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("That slug is already in use.", { slug: ["Already in use."] });
    }
    return fail(e instanceof Error ? e.message : "Could not save the asset.");
  }
}

export async function deleteAsset(id: string): Promise<ActionResult> {
  try {
    await authorize();
    await db.asset.delete({ where: { id } });
    revalidatePath("/admin/assets");
    revalidatePath("/assets");
    return { ok: true, data: undefined };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail("You do not have permission.");
    return fail("Could not delete the asset.");
  }
}
