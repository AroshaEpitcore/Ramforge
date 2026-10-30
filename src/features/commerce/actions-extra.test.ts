import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  db: {
    video: { findUnique: vi.fn() },
    bundle: { findUnique: vi.fn() },
    course: { findUnique: vi.fn() },
    purchase: { findFirst: vi.fn() },
    order: { create: vi.fn(), update: vi.fn() },
  },
  requireCurrentUser: vi.fn(),
  isPaymentsEnabled: vi.fn(),
  getVatRatePercent: vi.fn(),
  createCheckoutSession: vi.fn(),
  grantOrderAccess: vi.fn(),
  validateCoupon: vi.fn(),
  redeemCoupon: vi.fn(),
  sendPurchaseConfirmation: vi.fn(),
}));

vi.mock("@/server/db", () => ({ db: h.db }));
vi.mock("@/server/current-user", () => ({ requireCurrentUser: h.requireCurrentUser }));
vi.mock("@/server/services/settings", () => ({
  isPaymentsEnabled: h.isPaymentsEnabled,
  getVatRatePercent: h.getVatRatePercent,
}));
vi.mock("@/lib/stripe/server", () => ({ createCheckoutSession: h.createCheckoutSession }));
vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_APP_URL: "http://localhost:3000" } }));
vi.mock("@/server/services/entitlements", () => ({ grantOrderAccess: h.grantOrderAccess }));
vi.mock("@/server/services/coupons", () => ({
  validateCoupon: h.validateCoupon,
  redeemCoupon: h.redeemCoupon,
}));
vi.mock("@/server/services/order-notifications", () => ({
  sendPurchaseConfirmation: h.sendPurchaseConfirmation,
}));

import { buyBundle, buyVideo, previewCoupon } from "./actions";

const user = { id: "u1", email: "u@x.com", role: "CUSTOMER", name: "U" };

beforeEach(() => {
  vi.clearAllMocks();
  h.requireCurrentUser.mockResolvedValue(user);
  h.isPaymentsEnabled.mockResolvedValue(true);
  h.getVatRatePercent.mockResolvedValue(0);
  h.db.purchase.findFirst.mockResolvedValue(null);
  h.db.order.create.mockResolvedValue({ id: "o1" });
  h.db.order.update.mockResolvedValue({});
  h.createCheckoutSession.mockResolvedValue({ id: "cs_1", url: "https://checkout/x" });
  h.grantOrderAccess.mockResolvedValue({ ok: true });
});

describe("buyVideo — rentals", () => {
  const paidVideo = (over = {}) => ({
    id: "v1",
    title: "Clip",
    slug: "clip",
    price: 5000,
    salePrice: null,
    status: "PUBLISHED",
    accessMode: "PAID",
    rentalDays: 7,
    rentalPrice: 1500,
    ...over,
  });

  it("rejects renting a video that isn't rentable", async () => {
    h.db.video.findUnique.mockResolvedValue(paidVideo({ rentalDays: null, rentalPrice: null }));
    const res = await buyVideo({ id: "v1", waiverConsent: true, rental: true });
    expect(res.ok).toBe(false);
  });

  it("creates a RENTAL order item at the rental price", async () => {
    h.db.video.findUnique.mockResolvedValue(paidVideo());
    const res = await buyVideo({ id: "v1", waiverConsent: true, rental: true });
    expect(res.ok).toBe(true);
    const arg = h.db.order.create.mock.calls[0][0];
    expect(arg.data.total).toBe(1500);
    expect(arg.data.items.create).toMatchObject({ type: "RENTAL", rentalDays: 7, videoId: "v1" });
  });

  it("blocks buying when the user already has access", async () => {
    h.db.video.findUnique.mockResolvedValue(paidVideo());
    h.db.purchase.findFirst.mockResolvedValue({ id: "p1" });
    const res = await buyVideo({ id: "v1", waiverConsent: true });
    expect(res.ok).toBe(false);
  });
});

describe("buyBundle", () => {
  it("fails for a bundle with no videos", async () => {
    h.db.bundle.findUnique.mockResolvedValue({
      id: "b1",
      title: "B",
      slug: "b",
      price: 9900,
      salePrice: null,
      status: "PUBLISHED",
      _count: { videos: 0 },
    });
    expect((await buyBundle({ id: "b1", waiverConsent: true })).ok).toBe(false);
  });

  it("creates a bundle order", async () => {
    h.db.bundle.findUnique.mockResolvedValue({
      id: "b1",
      title: "B",
      slug: "b",
      price: 9900,
      salePrice: null,
      status: "PUBLISHED",
      _count: { videos: 3 },
    });
    const res = await buyBundle({ id: "b1", waiverConsent: true });
    expect(res.ok).toBe(true);
    expect(h.db.order.create.mock.calls[0][0].data.items.create).toMatchObject({ bundleId: "b1" });
  });
});

describe("VAT", () => {
  it("adds a VAT line and tax total when a rate is set", async () => {
    h.getVatRatePercent.mockResolvedValue(20);
    h.db.course.findUnique.mockResolvedValue({
      id: "c1",
      title: "C",
      slug: "c",
      price: 5000,
      salePrice: null,
      status: "PUBLISHED",
    });
    const { buyCourse } = await import("./actions");
    const res = await buyCourse({ id: "c1", waiverConsent: true });
    expect(res.ok).toBe(true);
    const order = h.db.order.create.mock.calls[0][0].data;
    expect(order.taxTotal).toBe(1000);
    expect(order.total).toBe(6000);
    expect(h.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        lines: expect.arrayContaining([expect.objectContaining({ amountMinor: 1000 })]),
      }),
    );
  });
});

describe("free via 100% coupon", () => {
  it("grants access directly without Stripe", async () => {
    h.db.course.findUnique.mockResolvedValue({
      id: "c1",
      title: "C",
      slug: "c",
      price: 5000,
      salePrice: null,
      status: "PUBLISHED",
    });
    h.validateCoupon.mockResolvedValue({
      ok: true,
      couponId: "cp1",
      code: "FREE",
      discount: 5000,
      finalPrice: 0,
    });
    const { buyCourse } = await import("./actions");
    const res = await buyCourse({ id: "c1", waiverConsent: true, couponCode: "FREE" });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.url).toContain("/order-confirmation?order=");
    expect(h.createCheckoutSession).not.toHaveBeenCalled();
    expect(h.grantOrderAccess).toHaveBeenCalledWith("o1");
    expect(h.redeemCoupon).toHaveBeenCalledWith("cp1");
  });
});

describe("previewCoupon", () => {
  it("returns the discount for a valid code", async () => {
    h.db.video.findUnique.mockResolvedValue({ price: 5000, salePrice: null });
    h.validateCoupon.mockResolvedValue({
      ok: true,
      couponId: "cp1",
      code: "SAVE",
      discount: 1000,
      finalPrice: 4000,
    });
    const res = await previewCoupon({ kind: "video", id: "v1", code: "SAVE" });
    expect(res.ok).toBe(true);
    if (res.ok)
      expect(res.data).toMatchObject({ discount: 1000, finalPrice: 4000, originalPrice: 5000 });
  });

  it("surfaces an invalid-coupon error", async () => {
    h.db.bundle.findUnique.mockResolvedValue({ price: 9900, salePrice: null });
    h.validateCoupon.mockResolvedValue({ ok: false, error: "Invalid coupon code." });
    const res = await previewCoupon({ kind: "bundle", id: "b1", code: "NOPE" });
    expect(res.ok).toBe(false);
  });
});
