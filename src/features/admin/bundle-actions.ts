"use server";

import { bundleSchema } from "@/features/admin/schemas";
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

async function authorize() {
  requirePermission(await requireCurrentUser(), "bundles:manage");
}

export async function saveBundle(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = bundleSchema.safeParse(raw);
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
      description: d.description,
      thumbnailUrl: d.thumbnailUrl && d.thumbnailUrl.trim() ? d.thumbnailUrl.trim() : null,
      price: Math.round(d.priceMajor * 100),
      status: d.status,
    };

    const id = await db.$transaction(async (tx) => {
      const bundle = d.id
        ? await tx.bundle.update({ where: { id: d.id }, data })
        : await tx.bundle.create({ data });
      // Replace the membership set.
      await tx.bundleVideo.deleteMany({ where: { bundleId: bundle.id } });
      if (d.videoIds.length > 0) {
        await tx.bundleVideo.createMany({
          data: d.videoIds.map((videoId, i) => ({ bundleId: bundle.id, videoId, position: i })),
          skipDuplicates: true,
        });
      }
      return bundle.id;
    });

    revalidatePath("/admin/bundles");
    revalidatePath("/bundles");
    revalidatePath(`/bundles/${data.slug}`);
    return { ok: true, data: { id } };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail("You do not have permission.");
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("That slug is already in use.", { slug: ["Already in use."] });
    }
    return fail("Could not save the bundle.");
  }
}

export async function deleteBundle(id: string): Promise<ActionResult> {
  try {
    await authorize();
    await db.bundle.delete({ where: { id } });
    revalidatePath("/admin/bundles");
    revalidatePath("/bundles");
    return { ok: true, data: undefined };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail("You do not have permission.");
    return fail("Could not delete the bundle.");
  }
}
