"use server";

import { blogPostSchema } from "@/features/admin/schemas";
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
const toDate = (v?: string) => (v && v.trim() ? new Date(v) : null);

/** Revalidate every surface a post can appear on. */
function revalidateBlog(slug: string) {
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/"); // homepage "latest posts" strip
}

export async function saveBlogPost(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = blogPostSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(
      "Please fix the highlighted fields.",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }
  const d = parsed.data;
  try {
    const user = await requireCurrentUser();
    requirePermission(user, "blog:manage");

    const slug = slugify(d.slug || d.title);
    const data = {
      title: d.title,
      slug,
      excerpt: d.excerpt,
      body: d.body,
      coverImageUrl: nullify(d.coverImageUrl),
      status: d.status,
      publishAt: toDate(d.publishAt),
      publishedAt: d.status === "PUBLISHED" ? new Date() : null,
    };

    const row = d.id
      ? await db.blogPost.update({ where: { id: d.id }, data })
      : await db.blogPost.create({ data: { ...data, authorId: user.id } });

    revalidateBlog(slug);
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail("You do not have permission to do that.");
    if (e instanceof Error && e.message === "UNAUTHENTICATED")
      return fail("You must be signed in.");
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("That slug is already in use.", { slug: ["Already in use."] });
    }
    return fail(e instanceof Error ? e.message : "Could not save the post.");
  }
}

export async function deleteBlogPost(id: string): Promise<ActionResult> {
  try {
    requirePermission(await requireCurrentUser(), "blog:manage");
    await db.blogPost.delete({ where: { id } });
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail("You do not have permission to do that.");
    return fail("Could not delete the post.");
  }
}
