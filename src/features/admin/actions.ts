"use server";

import {
  categorySchema,
  courseSchema,
  reorderLessonsSchema,
  videoSchema,
} from "@/features/admin/schemas";
import { ForbiddenError, requirePermission, type Permission } from "@/lib/rbac";
import { slugify } from "@/lib/slug";
import { db } from "@/server/db";
import { getCourseLessons } from "@/server/queries/admin";
import { requireCurrentUser } from "@/server/current-user";
import { SETTING_KEYS, setSetting } from "@/server/services/settings";
import type { ActionResult, SessionUser } from "@/types";
import { Prisma } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- helpers ---------------------------------------------------------------

function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

function zerr(error: z.ZodError): ActionResult<never> {
  return fail(
    "Please fix the highlighted fields.",
    z.flattenError(error).fieldErrors as Record<string, string[]>,
  );
}

/** Resolve + authorize the current user, throwing on failure. */
async function authorize(permission: Permission): Promise<SessionUser> {
  const user = await requireCurrentUser();
  requirePermission(user, permission);
  return user;
}

/** Map thrown errors to a typed failure (permission, auth, unique-slug, generic). */
function handleError(e: unknown): ActionResult<never> {
  if (e instanceof ForbiddenError) return fail("You do not have permission to do that.");
  if (e instanceof Error && e.message === "UNAUTHENTICATED") return fail("You must be signed in.");
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    const target = (e.meta?.target as string[] | undefined)?.join(", ") ?? "value";
    if (target.includes("slug"))
      return fail("That slug is already in use.", { slug: ["Already in use."] });
    if (target.includes("position")) {
      return fail("Another lesson already uses that position in the course.", {
        position: ["Already used in this course."],
      });
    }
    return fail(`That ${target} is already in use.`);
  }
  return fail(e instanceof Error ? e.message : "Something went wrong.");
}

const toMinor = (major: number) => Math.round(major * 100);
const toDate = (v?: string) => (v && v.trim() ? new Date(v) : null);
/** Empty / whitespace string → null (for optional DB columns). */
const nullify = (v?: string | null) => (v && v.trim() ? v.trim() : null);

// --- Categories ------------------------------------------------------------

export async function saveCategory(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) return zerr(parsed.error);
  const d = parsed.data;
  try {
    await authorize("categories:manage");
    const data = {
      name: d.name,
      slug: slugify(d.slug || d.name),
      description: nullify(d.description),
      parentId: nullify(d.parentId),
    };
    const row = d.id
      ? await db.category.update({ where: { id: d.id }, data })
      : await db.category.create({ data });
    revalidatePath("/admin/categories");
    revalidatePath("/categories");
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await authorize("categories:manage");
    await db.category.delete({ where: { id } });
    revalidatePath("/admin/categories");
    return { ok: true, data: undefined };
  } catch (e) {
    // FK violation (videos/courses still reference it) surfaces as a known error.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return fail("Remove or reassign its videos and courses first.");
    }
    return handleError(e);
  }
}

// --- Courses ---------------------------------------------------------------

export async function saveCourse(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = courseSchema.safeParse(raw);
  if (!parsed.success) return zerr(parsed.error);
  const d = parsed.data;
  try {
    await authorize(d.id ? "videos:update" : "videos:create");
    const data = {
      title: d.title,
      slug: slugify(d.slug || d.title),
      description: d.description,
      categoryId: nullify(d.categoryId),
      price: toMinor(d.priceMajor),
      status: d.status,
      publishAt: toDate(d.publishAt),
    };
    const row = d.id
      ? await db.course.update({ where: { id: d.id }, data })
      : await db.course.create({ data });
    revalidatePath("/admin/courses");
    revalidatePath("/courses");
    revalidatePath(`/courses/${data.slug}`);
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteCourse(id: string): Promise<ActionResult> {
  try {
    await authorize("videos:delete");
    // Detach lessons (keep the videos) then delete the course.
    await db.$transaction([
      db.video.updateMany({ where: { courseId: id }, data: { courseId: null, position: 0 } }),
      db.course.delete({ where: { id } }),
    ]);
    revalidatePath("/admin/courses");
    revalidatePath("/courses");
    return { ok: true, data: undefined };
  } catch (e) {
    return handleError(e);
  }
}

export async function loadCourseLessons(
  courseId: string,
): Promise<ActionResult<{ id: string; title: string; position: number }[]>> {
  try {
    await authorize("videos:read");
    const lessons = await getCourseLessons(courseId);
    return { ok: true, data: lessons.map(({ id, title, position }) => ({ id, title, position })) };
  } catch (e) {
    return handleError(e);
  }
}

export async function reorderLessons(raw: unknown): Promise<ActionResult> {
  const parsed = reorderLessonsSchema.safeParse(raw);
  if (!parsed.success) return zerr(parsed.error);
  const { courseId, videoIds } = parsed.data;
  try {
    await authorize("videos:update");
    // Two-pass to avoid tripping the unique (courseId, position) constraint:
    // park everything at negative positions, then set final 1..n.
    await db.$transaction([
      ...videoIds.map((id, i) => db.video.update({ where: { id }, data: { position: -(i + 1) } })),
      ...videoIds.map((id, i) =>
        db.video.update({ where: { id, courseId }, data: { position: i + 1 } }),
      ),
    ]);
    revalidatePath("/admin/courses");
    return { ok: true, data: undefined };
  } catch (e) {
    return handleError(e);
  }
}

// --- Videos ----------------------------------------------------------------

export async function saveVideo(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = videoSchema.safeParse(raw);
  if (!parsed.success) return zerr(parsed.error);
  const d = parsed.data;
  try {
    const user = await authorize(d.id ? "videos:update" : "videos:create");
    const slug = slugify(d.slug || d.title);
    const publishedNow = d.status === "PUBLISHED";
    const courseId = nullify(d.courseId);
    const data = {
      title: d.title,
      slug,
      description: d.description,
      categoryId: d.categoryId,
      courseId,
      position: courseId ? d.position : 0,
      source: d.source,
      youtubeId: d.source === "YOUTUBE" ? nullify(d.youtubeId) : null,
      fullAssetId: d.source === "MUX" ? nullify(d.fullAssetId) : null,
      accessMode: d.accessMode,
      price: d.accessMode === "PAID" ? toMinor(d.priceMajor) : 0,
      rentalDays: d.accessMode === "PAID" && d.rentalDays > 0 ? d.rentalDays : null,
      rentalPrice:
        d.accessMode === "PAID" && d.rentalDays > 0 && d.rentalPriceMajor > 0
          ? toMinor(d.rentalPriceMajor)
          : null,
      status: d.status,
      publishAt: toDate(d.publishAt),
      notes: nullify(d.notes),
      publishedAt: publishedNow ? new Date() : null,
    };
    const row = d.id
      ? await db.video.update({ where: { id: d.id }, data })
      : await db.video.create({ data: { ...data, uploadedById: user.id } });
    revalidatePath("/admin/videos");
    revalidatePath("/shop");
    revalidatePath(`/video/${slug}`);
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteVideo(id: string): Promise<ActionResult> {
  try {
    await authorize("videos:delete");
    await db.video.delete({ where: { id } });
    revalidatePath("/admin/videos");
    revalidatePath("/shop");
    return { ok: true, data: undefined };
  } catch (e) {
    return handleError(e);
  }
}

// --- Settings --------------------------------------------------------------

export async function setPaymentsEnabled(enabled: boolean): Promise<ActionResult> {
  try {
    await authorize("settings:manage");
    await setSetting(SETTING_KEYS.paymentsEnabled, enabled);
    revalidatePath("/admin/settings");
    revalidatePath("/", "layout");
    return { ok: true, data: undefined };
  } catch (e) {
    return handleError(e);
  }
}

export async function setVatRate(percent: number): Promise<ActionResult> {
  try {
    await authorize("settings:manage");
    const rate = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
    await setSetting(SETTING_KEYS.vatRatePercent, rate);
    revalidatePath("/admin/settings");
    return { ok: true, data: undefined };
  } catch (e) {
    return handleError(e);
  }
}

// --- Newsletter ------------------------------------------------------------

/** Export confirmed-or-pending subscribers as CSV text (admin downloads it). */
export async function exportNewsletterCsv(): Promise<ActionResult<string>> {
  try {
    await authorize("settings:manage");
    const rows = await db.newsletterSubscriber.findMany({
      where: { unsubscribedAt: null },
      orderBy: { createdAt: "desc" },
      select: { email: true, source: true, confirmed: true, createdAt: true },
    });
    const header = "email,source,confirmed,created_at";
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const body = rows
      .map((r) =>
        [r.email, r.source ?? "", String(r.confirmed), r.createdAt.toISOString()]
          .map(escape)
          .join(","),
      )
      .join("\n");
    return { ok: true, data: `${header}\n${body}\n` };
  } catch (e) {
    return handleError(e);
  }
}
