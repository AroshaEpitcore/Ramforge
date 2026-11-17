"use server";

import { reviewSchema } from "@/features/reviews/schemas";
import { ForbiddenError, requirePermission } from "@/lib/rbac";
import { db } from "@/server/db";
import { requireCurrentUser } from "@/server/current-user";
import type { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/**
 * Submit a review for a video. Anyone can review (no sign-in required, like
 * YouTube-style comments) and reviews publish immediately — staff can still
 * remove abusive ones from Admin → Reviews. Signed-in users get one editable
 * review per video; anonymous reviews are added each time with a display name.
 */
export async function submitReview(raw: unknown): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(
      "Please fix the highlighted fields.",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }
  const { videoId, rating, title, body, name } = parsed.data;

  // Sign-in is optional — resolve a user if there is one, otherwise go anonymous.
  let userId: string | null = null;
  try {
    userId = (await requireCurrentUser()).id;
  } catch {
    userId = null;
  }

  try {
    const video = await db.video.findUnique({
      where: { id: videoId },
      select: { slug: true, status: true },
    });
    if (!video || video.status !== "PUBLISHED") return fail("Video not found.");

    if (userId) {
      // One editable review per signed-in user.
      await db.review.upsert({
        where: { videoId_userId: { videoId, userId } },
        update: { rating, title: title ?? null, body, approved: true },
        create: { videoId, userId, rating, title: title ?? null, body, approved: true },
      });
    } else {
      // Anonymous review — store the display name (defaults to "Anonymous").
      await db.review.create({
        data: {
          videoId,
          rating,
          title: title ?? null,
          body,
          authorName: name?.trim() || "Anonymous",
          approved: true,
        },
      });
    }

    revalidatePath(`/video/${video.slug}`);
    revalidatePath("/admin/reviews");
    return { ok: true, data: undefined };
  } catch {
    return fail("Could not submit your review. Please try again.");
  }
}

/** Approve a review so it appears publicly (moderator only). */
export async function approveReview(id: string): Promise<ActionResult> {
  try {
    requirePermission(await requireCurrentUser(), "reviews:moderate");
    const review = await db.review.update({
      where: { id },
      data: { approved: true },
      select: { video: { select: { slug: true } } },
    });
    revalidatePath("/admin/reviews");
    if (review.video) revalidatePath(`/video/${review.video.slug}`);
    return { ok: true, data: undefined };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail("You do not have permission.");
    return fail("Could not approve the review.");
  }
}

/** Delete a review (moderator only). */
export async function deleteReview(id: string): Promise<ActionResult> {
  try {
    requirePermission(await requireCurrentUser(), "reviews:moderate");
    const review = await db.review.delete({
      where: { id },
      select: { video: { select: { slug: true } } },
    });
    revalidatePath("/admin/reviews");
    if (review.video) revalidatePath(`/video/${review.video.slug}`);
    return { ok: true, data: undefined };
  } catch (e) {
    if (e instanceof ForbiddenError) return fail("You do not have permission.");
    return fail("Could not delete the review.");
  }
}
