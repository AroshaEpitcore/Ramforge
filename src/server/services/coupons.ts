import "server-only";

import { db } from "@/server/db";

export interface CouponApplication {
  couponId: string;
  code: string;
  discount: number; // minor units
  finalPrice: number; // minor units, >= 0
}

export type ValidateCouponResult =
  ({ ok: true } & CouponApplication) | { ok: false; error: string };

/** Normalise a coupon code for storage + lookup. */
export function normaliseCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Validate a coupon against an amount (minor units) and compute the discount.
 * Pure w.r.t. the amount; the redemption count is only incremented on payment.
 */
export async function validateCoupon(
  rawCode: string,
  amountMinor: number,
): Promise<ValidateCouponResult> {
  const code = normaliseCode(rawCode);
  if (!code) return { ok: false, error: "Enter a coupon code." };

  const coupon = await db.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.active) return { ok: false, error: "Invalid coupon code." };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now)
    return { ok: false, error: "This coupon isn't active yet." };
  if (coupon.expiresAt && coupon.expiresAt < now)
    return { ok: false, error: "This coupon has expired." };
  if (coupon.maxRedemptions != null && coupon.timesRedeemed >= coupon.maxRedemptions) {
    return { ok: false, error: "This coupon has been fully redeemed." };
  }

  const discount =
    coupon.type === "PERCENT"
      ? Math.round((amountMinor * Math.min(100, coupon.amount)) / 100)
      : Math.min(coupon.amount, amountMinor);
  const finalPrice = Math.max(0, amountMinor - discount);

  return { ok: true, couponId: coupon.id, code: coupon.code, discount, finalPrice };
}

/** Increment a coupon's redemption count (called once, on successful payment). */
export async function redeemCoupon(couponId: string): Promise<void> {
  await db.coupon.update({
    where: { id: couponId },
    data: { timesRedeemed: { increment: 1 } },
  });
}
