import { beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => ({ db: { coupon: { findUnique: vi.fn() } } }));
vi.mock("@/server/db", () => ({ db }));

import { validateCoupon } from "./coupons";

const coupon = (over: Record<string, unknown> = {}) => ({
  id: "cp1",
  code: "SAVE",
  type: "PERCENT",
  amount: 20,
  active: true,
  maxRedemptions: null,
  timesRedeemed: 0,
  startsAt: null,
  expiresAt: null,
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe("validateCoupon", () => {
  it("rejects an unknown code", async () => {
    db.coupon.findUnique.mockResolvedValue(null);
    const r = await validateCoupon("NOPE", 5000);
    expect(r.ok).toBe(false);
  });

  it("rejects an inactive coupon", async () => {
    db.coupon.findUnique.mockResolvedValue(coupon({ active: false }));
    expect((await validateCoupon("SAVE", 5000)).ok).toBe(false);
  });

  it("rejects an expired coupon", async () => {
    db.coupon.findUnique.mockResolvedValue(coupon({ expiresAt: new Date("2020-01-01") }));
    expect((await validateCoupon("SAVE", 5000)).ok).toBe(false);
  });

  it("rejects a fully-redeemed coupon", async () => {
    db.coupon.findUnique.mockResolvedValue(coupon({ maxRedemptions: 2, timesRedeemed: 2 }));
    expect((await validateCoupon("SAVE", 5000)).ok).toBe(false);
  });

  it("applies a percentage discount", async () => {
    db.coupon.findUnique.mockResolvedValue(coupon({ type: "PERCENT", amount: 20 }));
    const r = await validateCoupon("SAVE", 5000);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.discount).toBe(1000);
      expect(r.finalPrice).toBe(4000);
    }
  });

  it("caps a fixed discount at the price (never negative)", async () => {
    db.coupon.findUnique.mockResolvedValue(coupon({ type: "FIXED", amount: 1500 }));
    const r = await validateCoupon("SAVE", 1000);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.discount).toBe(1000);
      expect(r.finalPrice).toBe(0);
    }
  });
});
