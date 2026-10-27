"use server";

import { db } from "@/server/db";
import type { ActionResult } from "@/types";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  source: z.enum(["footer", "post-video", "coming-soon"]).optional(),
});

/**
 * Public newsletter sign-up. Idempotent: re-subscribing the same email just
 * refreshes its source and clears any prior unsubscribe. The list is the launch
 * channel for paid courses.
 */
export async function subscribeNewsletter(raw: unknown): Promise<ActionResult> {
  const parsed = subscribeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Enter a valid email address.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }
  const { email, source } = parsed.data;
  try {
    await db.newsletterSubscriber.upsert({
      where: { email },
      update: { source: source ?? null, unsubscribedAt: null },
      create: { email, source: source ?? null },
    });
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "Could not subscribe right now. Please try again." };
  }
}
