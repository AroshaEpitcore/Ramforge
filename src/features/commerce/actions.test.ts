import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, requireCurrentUser, isPaymentsEnabled, createCheckoutSession } = vi.hoisted(() => ({
  db: {
    course: { findUnique: vi.fn() },
    purchase: { findFirst: vi.fn() },
    order: { create: vi.fn(), update: vi.fn() },
  },
  requireCurrentUser: vi.fn(),
  isPaymentsEnabled: vi.fn(),
  createCheckoutSession: vi.fn(),
}));

vi.mock("@/server/db", () => ({ db }));
vi.mock("@/server/current-user", () => ({ requireCurrentUser }));
vi.mock("@/server/services/settings", () => ({
  isPaymentsEnabled,
  getVatRatePercent: vi.fn(async () => 0),
}));
vi.mock("@/lib/stripe/server", () => ({ createCheckoutSession }));
vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_APP_URL: "http://localhost:3000" } }));

import { buyCourse } from "./actions";

const user = { id: "u1", email: "u@x.com", role: "CUSTOMER", name: "U" };

beforeEach(() => {
  vi.clearAllMocks();
  requireCurrentUser.mockResolvedValue(user);
  isPaymentsEnabled.mockResolvedValue(true);
});

describe("buyCourse", () => {
  it("fails when the waiver isn't accepted", async () => {
    const res = await buyCourse({ id: "c1", waiverConsent: false });
    expect(res.ok).toBe(false);
    expect(db.order.create).not.toHaveBeenCalled();
  });

  it("fails when payments are disabled", async () => {
    isPaymentsEnabled.mockResolvedValue(false);
    const res = await buyCourse({ id: "c1", waiverConsent: true });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/not enabled/i);
  });

  it("fails for a free course", async () => {
    db.course.findUnique.mockResolvedValue({
      id: "c1",
      title: "Free",
      slug: "free",
      price: 0,
      salePrice: null,
      status: "PUBLISHED",
    });
    const res = await buyCourse({ id: "c1", waiverConsent: true });
    expect(res.ok).toBe(false);
  });

  it("fails if already owned", async () => {
    db.course.findUnique.mockResolvedValue({
      id: "c1",
      title: "Paid",
      slug: "paid",
      price: 4900,
      salePrice: null,
      status: "PUBLISHED",
    });
    db.purchase.findFirst.mockResolvedValue({ id: "p1" });
    const res = await buyCourse({ id: "c1", waiverConsent: true });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/already own/i);
  });

  it("creates a PENDING order and returns a Stripe checkout URL", async () => {
    db.course.findUnique.mockResolvedValue({
      id: "c1",
      title: "Nuke",
      slug: "nuke",
      price: 4900,
      salePrice: null,
      status: "PUBLISHED",
    });
    db.purchase.findFirst.mockResolvedValue(null);
    db.order.create.mockResolvedValue({ id: "o1" });
    createCheckoutSession.mockResolvedValue({ id: "cs_1", url: "https://checkout.stripe/x" });

    const res = await buyCourse({ id: "c1", waiverConsent: true });

    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.url).toBe("https://checkout.stripe/x");
    expect(db.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "u1", status: "PENDING", total: 4900 }),
      }),
    );
    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { orderId: "o1" } }),
    );
    expect(db.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { stripeCheckoutId: "cs_1" } }),
    );
  });
});
