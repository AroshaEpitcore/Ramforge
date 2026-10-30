"use server";

import { siteConfig } from "@/config/site";
import { env } from "@/lib/env";
import { createCheckoutSession } from "@/lib/stripe/server";
import { db } from "@/server/db";
import { requireCurrentUser } from "@/server/current-user";
import { grantAccess } from "@/server/services/entitlements";
import { redeemCoupon, validateCoupon } from "@/server/services/coupons";
import { isPaymentsEnabled } from "@/server/services/settings";
import type { ActionResult } from "@/types";
import { z } from "zod";

const buySchema = z.object({
  id: z.string().min(1),
  waiverConsent: z.boolean().refine((v) => v === true, "You must accept the terms to continue."),
  couponCode: z.string().trim().optional(),
});

const previewSchema = z.object({
  kind: z.enum(["course", "video"]),
  id: z.string().min(1),
  code: z.string().trim().min(1),
});

function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

const base = () => env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

async function startCheckout(opts: {
  kind: "course" | "video";
  id: string;
  title: string;
  subtotal: number;
  finalPrice: number;
  couponId?: string;
  userId: string;
  userEmail: string;
  cancelPath: string;
}): Promise<ActionResult<{ url: string }>> {
  const order = await db.order.create({
    data: {
      userId: opts.userId,
      status: "PENDING",
      subtotal: opts.subtotal,
      taxTotal: 0,
      total: opts.finalPrice,
      currency: siteConfig.currency,
      couponId: opts.couponId ?? null,
      waiverConsent: true,
      waiverConsentAt: new Date(),
      items: {
        create: {
          type: "STREAM",
          unitPrice: opts.subtotal,
          quantity: 1,
          ...(opts.kind === "course" ? { courseId: opts.id } : { videoId: opts.id }),
        },
      },
    },
    select: { id: true },
  });

  // Free after discount → grant immediately, no Stripe (which rejects $0).
  if (opts.finalPrice <= 0) {
    await db.order.update({ where: { id: order.id }, data: { status: "PAID" } });
    await grantAccess({
      userId: opts.userId,
      orderId: order.id,
      ...(opts.kind === "course" ? { courseId: opts.id } : { videoId: opts.id }),
    });
    if (opts.couponId) await redeemCoupon(opts.couponId);
    return { ok: true, data: { url: `${base()}/order-confirmation?order=${order.id}` } };
  }

  const session = await createCheckoutSession({
    lines: [{ name: opts.title, amountMinor: opts.finalPrice }],
    customerEmail: opts.userEmail,
    successUrl: `${base()}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base()}${opts.cancelPath}`,
    metadata: { orderId: order.id },
  });
  await db.order.update({ where: { id: order.id }, data: { stripeCheckoutId: session.id } });
  if (!session.url) return fail("Could not start checkout. Please try again.");
  return { ok: true, data: { url: session.url } };
}

/** Validate a coupon against a course/video and return the resulting price. */
export async function previewCoupon(
  raw: unknown,
): Promise<ActionResult<{ discount: number; finalPrice: number; originalPrice: number }>> {
  const parsed = previewSchema.safeParse(raw);
  if (!parsed.success) return fail("Enter a coupon code.");
  const { kind, id, code } = parsed.data;
  try {
    const price =
      kind === "course"
        ? await db.course
            .findUnique({ where: { id }, select: { price: true, salePrice: true } })
            .then((c) => (c ? (c.salePrice ?? c.price) : null))
        : await db.video
            .findUnique({ where: { id }, select: { price: true, salePrice: true } })
            .then((v) => (v ? (v.salePrice ?? v.price) : null));
    if (price == null) return fail("Item not found.");

    const res = await validateCoupon(code, price);
    if (!res.ok) return fail(res.error);
    return {
      ok: true,
      data: { discount: res.discount, finalPrice: res.finalPrice, originalPrice: price },
    };
  } catch {
    return fail("Could not apply the coupon.");
  }
}

async function resolveCoupon(
  code: string | undefined,
  price: number,
): Promise<{ ok: true; couponId?: string; finalPrice: number } | { ok: false; error: string }> {
  if (!code || !code.trim()) return { ok: true, finalPrice: price };
  const res = await validateCoupon(code, price);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, couponId: res.couponId, finalPrice: res.finalPrice };
}

/** Begin purchase of a paid course → returns a URL to redirect to. */
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

    const coupon = await resolveCoupon(parsed.data.couponCode, price);
    if (!coupon.ok) return fail(coupon.error, { couponCode: [coupon.error] });

    return await startCheckout({
      kind: "course",
      id: course.id,
      title: course.title,
      subtotal: price,
      finalPrice: coupon.finalPrice,
      couponId: coupon.couponId,
      userId: user.id,
      userEmail: user.email,
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

    const coupon = await resolveCoupon(parsed.data.couponCode, price);
    if (!coupon.ok) return fail(coupon.error, { couponCode: [coupon.error] });

    return await startCheckout({
      kind: "video",
      id: video.id,
      title: video.title,
      subtotal: price,
      finalPrice: coupon.finalPrice,
      couponId: coupon.couponId,
      userId: user.id,
      userEmail: user.email,
      cancelPath: `/video/${video.slug}`,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHENTICATED")
      return fail("Please sign in to buy.");
    return fail("Could not start checkout. Please try again.");
  }
}
