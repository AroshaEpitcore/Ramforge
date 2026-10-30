import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  db,
  constructEvent,
  grantOrderAccess,
  revokeOrderAccess,
  redeemCoupon,
  sendPurchaseConfirmation,
} = vi.hoisted(() => ({
  db: {
    processedWebhookEvent: { findUnique: vi.fn(), create: vi.fn() },
    order: { findUnique: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
  },
  constructEvent: vi.fn(),
  grantOrderAccess: vi.fn(),
  revokeOrderAccess: vi.fn(),
  redeemCoupon: vi.fn(),
  sendPurchaseConfirmation: vi.fn(),
}));

vi.mock("@/lib/env", () => ({ env: { STRIPE_WEBHOOK_SECRET: "whsec_test" } }));
vi.mock("@/lib/stripe/server", () => ({ stripe: { webhooks: { constructEvent } } }));
vi.mock("@/server/db", () => ({ db }));
vi.mock("@/server/services/entitlements", () => ({ grantOrderAccess, revokeOrderAccess }));
vi.mock("@/server/services/coupons", () => ({ redeemCoupon }));
vi.mock("@/server/services/order-notifications", () => ({ sendPurchaseConfirmation }));

import { POST } from "./route";

function req(body: string, sig?: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (sig) headers["stripe-signature"] = sig;
  return new NextRequest("http://localhost/api/webhooks/stripe", { method: "POST", body, headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  db.processedWebhookEvent.findUnique.mockResolvedValue(null);
  db.processedWebhookEvent.create.mockResolvedValue({});
  db.order.update.mockResolvedValue({});
  grantOrderAccess.mockResolvedValue({ ok: true });
  revokeOrderAccess.mockResolvedValue({ ok: true });
});

describe("POST /api/webhooks/stripe", () => {
  it("400 when the signature header is missing", async () => {
    const res = await POST(req("{}"));
    expect(res.status).toBe(400);
  });

  it("400 on an invalid signature", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("bad sig");
    });
    const res = await POST(req("{}", "sig"));
    expect(res.status).toBe(400);
  });

  it("ignores a duplicate event (idempotency)", async () => {
    constructEvent.mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: {} },
    });
    db.processedWebhookEvent.findUnique.mockResolvedValue({ id: "evt_1" });
    const res = await POST(req("{}", "sig"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.duplicate).toBe(true);
    expect(grantOrderAccess).not.toHaveBeenCalled();
  });

  it("marks the order paid and grants access on checkout.session.completed", async () => {
    constructEvent.mockReturnValue({
      id: "evt_2",
      type: "checkout.session.completed",
      data: { object: { metadata: { orderId: "o1" }, payment_intent: "pi_1" } },
    });
    db.order.findUnique.mockResolvedValue({ id: "o1", status: "PENDING", couponId: "cp1" });
    const res = await POST(req("{}", "sig"));
    expect(res.status).toBe(200);
    expect(db.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PAID" }) }),
    );
    expect(grantOrderAccess).toHaveBeenCalledWith("o1");
    expect(redeemCoupon).toHaveBeenCalledWith("cp1");
    expect(sendPurchaseConfirmation).toHaveBeenCalledWith("o1");
    expect(db.processedWebhookEvent.create).toHaveBeenCalled();
  });

  it("revokes access on charge.refunded", async () => {
    constructEvent.mockReturnValue({
      id: "evt_3",
      type: "charge.refunded",
      data: { object: { payment_intent: "pi_1" } },
    });
    db.order.findFirst.mockResolvedValue({ id: "o1" });
    const res = await POST(req("{}", "sig"));
    expect(res.status).toBe(200);
    expect(db.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "REFUNDED" } }),
    );
    expect(revokeOrderAccess).toHaveBeenCalledWith("o1");
  });
});
