"use server";

import { db } from "@/server/db";
import { requireCurrentUser } from "@/server/current-user";
import type { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";

/** Add/remove a video from the signed-in user's favourites. Returns new state. */
export async function toggleFavourite(
  videoId: string,
): Promise<ActionResult<{ favourited: boolean }>> {
  let userId: string;
  try {
    userId = (await requireCurrentUser()).id;
  } catch {
    return { ok: false, error: "Please sign in to save favourites." };
  }

  try {
    const existing = await db.favourite.findUnique({
      where: { userId_videoId: { userId, videoId } },
      select: { userId: true },
    });
    if (existing) {
      await db.favourite.delete({ where: { userId_videoId: { userId, videoId } } });
      revalidatePath("/account/favourites");
      return { ok: true, data: { favourited: false } };
    }
    await db.favourite.create({ data: { userId, videoId } });
    revalidatePath("/account/favourites");
    return { ok: true, data: { favourited: true } };
  } catch {
    return { ok: false, error: "Could not update favourites. Please try again." };
  }
}
