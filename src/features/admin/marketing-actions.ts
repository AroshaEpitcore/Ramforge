"use server";

import { bannerSchema, emailTemplateSchema } from "@/features/admin/schemas";
import { ForbiddenError, requirePermission, type Permission } from "@/lib/rbac";
import { db } from "@/server/db";
import { requireCurrentUser } from "@/server/current-user";
import type { ActionResult } from "@/types";
import { Prisma } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}
function zerr(e: z.ZodError): ActionResult<never> {
  return fail(
    "Please fix the highlighted fields.",
    z.flattenError(e).fieldErrors as Record<string, string[]>,
  );
}
const nullify = (v?: string) => (v && v.trim() ? v.trim() : null);

async function authorize(permission: Permission) {
  requirePermission(await requireCurrentUser(), permission);
}

// --- Banners ---------------------------------------------------------------

export async function saveBanner(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = bannerSchema.safeParse(raw);
  if (!parsed.success) return zerr(parsed.error);
  const d = parsed.data;
  try {
    await authorize("banners:manage");
    const data = {
      title: d.title,
      subtitle: nullify(d.subtitle),
      eyebrow: nullify(d.eyebrow),
      imageUrl: d.imageUrl,
      ctaLabel: nullify(d.ctaLabel),
      ctaHref: nullify(d.ctaHref),
      position: d.position,
      active: d.active,
    };
    const row = d.id
      ? await db.banner.update({ where: { id: d.id }, data })
      : await db.banner.create({ data });
    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail("You do not have permission.");
    return fail("Could not save the banner.");
  }
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  try {
    await authorize("banners:manage");
    await db.banner.delete({ where: { id } });
    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail("You do not have permission.");
    return fail("Could not delete the banner.");
  }
}

// --- Email templates -------------------------------------------------------

export async function saveEmailTemplate(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = emailTemplateSchema.safeParse(raw);
  if (!parsed.success) return zerr(parsed.error);
  const d = parsed.data;
  try {
    await authorize("emailTemplates:manage");
    const data = { key: d.key.trim(), name: d.name, subject: d.subject, body: d.body };
    const row = d.id
      ? await db.emailTemplate.update({ where: { id: d.id }, data })
      : await db.emailTemplate.create({ data });
    revalidatePath("/admin/emails");
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail("You do not have permission.");
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("That key is already in use.", { key: ["Already in use."] });
    }
    return fail("Could not save the template.");
  }
}

export async function deleteEmailTemplate(id: string): Promise<ActionResult> {
  try {
    await authorize("emailTemplates:manage");
    await db.emailTemplate.delete({ where: { id } });
    revalidatePath("/admin/emails");
    return { ok: true, data: undefined };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail("You do not have permission.");
    return fail("Could not delete the template.");
  }
}
