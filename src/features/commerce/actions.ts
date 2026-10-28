"use server";

import { siteConfig } from "@/config/site";
import { env } from "@/lib/env";
import { createCheckoutSession } from "@/lib/stripe/server";
import { db } from "@/server/db";
import { requireCurrentUser } from "@/server/current-user";
import { isPaymentsEnabled } from "@/server/services/settings";
import type { ActionResult } from "@/types";
import { z } from "zod";

const buySchema = z.object({
  id: z.string().min(1),
  waiverConsent: z.boolean().refine((v) => v === true, "You must accept the terms to continue."),
});

function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

async function startCheckout(opts: {
  kind: "course" | "video";
  id: string;
  waiverConsent: unknown;
  title: string;
  price: number;
  cancelPath: string;
}): Promise<ActionResult<{ url: string }>> {
  const user = await requireCurrentUser();

  const order = await db.order.create({
    data: {
      userId: user.id,
      status: "PENDING",
      subtotal: opts.price,
      taxTotal: 0,
      total: opts.price,
      currency: siteConfig.currency,
      waiverConsent: true,
      waiverConsentAt: new Date(),
      items: {
        create: {
          type: "STREAM",
          unitPrice: opts.price,
          quantity: 1,
          ...(opts.kind === "course" ? { courseId: opts.id } : { videoId: opts.id }),
        },
      },
    },
    select: { id: true },
  });

  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const session = await createCheckoutSession({
    lines: [{ name: opts.title, amountMinor: opts.price }],
    customerEmail: user.email,
    successUrl: `${base}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}${opts.cancelPath}`,
    metadata: { orderId: order.id },
  });

  await db.order.update({ where: { id: order.id }, data: { stripeCheckoutId: session.id } });

  if (!session.url) return fail("Could not start checkout. Please try again.");
  return { ok: true, data: { url: session.url } };
}

/** Begin purchase of a paid course → returns a Stripe Checkout URL to redirect to. */
export async function buyCourse(raw: unknown): Promise<ActionResult<{ url: string }>> {
  const parsed = buySchema.safeParse(raw);
  if (!parsed.success) {
    return fail(
      "Please accept the terms to continue.",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }
  try {
    if (!(await isPaymentsEnabled())) return fail("Payments are not enabled yet.");

    const course = await db.course.findUnique({
      where: { id: parsed.data.id },
      select: { id: true, title: true, slug: true, price: true, salePrice: true, status: true },
    });
    if (!course || course.status !== "PUBLISHED") return fail("Course not found.");

    const price = course.salePrice ?? course.price;
    if (price <= 0) return fail("This course is free.");

    const user = await requireCurrentUser();
    const owned = await db.purchase.findFirst({
      where: { userId: user.id, courseId: course.id, revokedAt: null },
      select: { id: true },
    });
    if (owned) return fail("You already own this course.");

    return await startCheckout({
      kind: "course",
      id: course.id,
      waiverConsent: parsed.data.waiverConsent,
      title: course.title,
      price,
      cancelPath: `/courses/${course.slug}`,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHENTICATED")
      return fail("Please sign in to buy.");
    return fail("Could not start checkout. Please try again.");
  }
}

/** Begin purchase of a paid standalone video. */
export async function buyVideo(raw: unknown): Promise<ActionResult<{ url: string }>> {
  const parsed = buySchema.safeParse(raw);
  if (!parsed.success) {
    return fail(
      "Please accept the terms to continue.",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }
  try {
    if (!(await isPaymentsEnabled())) return fail("Payments are not enabled yet.");

    const video = await db.video.findUnique({
      where: { id: parsed.data.id },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        salePrice: true,
        status: true,
        accessMode: true,
      },
    });
    if (!video || video.status !== "PUBLISHED" || video.accessMode === "FREE") {
      return fail("Video not found.");
    }

    const price = video.salePrice ?? video.price;
    if (price <= 0) return fail("This video is free.");

    const user = await requireCurrentUser();
    const owned = await db.purchase.findFirst({
      where: { userId: user.id, videoId: video.id, revokedAt: null },
      select: { id: true },
    });
    if (owned) return fail("You already own this video.");

    return await startCheckout({
      kind: "video",
      id: video.id,
      waiverConsent: parsed.data.waiverConsent,
      title: video.title,
      price,
      cancelPath: `/video/${video.slug}`,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHENTICATED")
      return fail("Please sign in to buy.");
    return fail("Could not start checkout. Please try again.");
  }
}
