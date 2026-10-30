import { beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => ({
  db: {
    order: { findUnique: vi.fn() },
    bundleVideo: { findMany: vi.fn() },
    purchase: { upsert: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    watchSession: { updateMany: vi.fn() },
  },
}));
vi.mock("@/server/db", () => ({ db }));

import { grantOrderAccess, revokeAccess, revokeOrderAccess } from "./entitlements";

beforeEach(() => {
  vi.clearAllMocks();
  db.purchase.upsert.mockResolvedValue({ id: "p1" });
});

describe("grantOrderAccess", () => {
  it("fails for a missing order", async () => {
    db.order.findUnique.mockResolvedValue(null);
    expect((await grantOrderAccess("o404")).ok).toBe(false);
  });

  it("grants a course item", async () => {
    db.order.findUnique.mockResolvedValue({
      userId: "u1",
      items: [{ courseId: "c1", videoId: null, bundleId: null, type: "STREAM", rentalDays: null }],
    });
    const res = await grantOrderAccess("o1");
    expect(res.ok).toBe(true);
    expect(db.purchase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ courseId: "c1" }) }),
    );
  });

  it("expands a bundle item into one grant per member video", async () => {
    db.order.findUnique.mockResolvedValue({
      userId: "u1",
      items: [{ courseId: null, videoId: null, bundleId: "b1", type: "STREAM", rentalDays: null }],
    });
    db.bundleVideo.findMany.mockResolvedValue([
      { videoId: "v1" },
      { videoId: "v2" },
      { videoId: "v3" },
    ]);
    await grantOrderAccess("o1");
    expect(db.purchase.upsert).toHaveBeenCalledTimes(3);
  });
});

describe("revokeAccess", () => {
  it("sets revokedAt and ends active watch sessions", async () => {
    db.purchase.findUnique.mockResolvedValue({ userId: "u1", videoId: "v1" });
    db.purchase.update.mockResolvedValue({});
    db.watchSession.updateMany.mockResolvedValue({});
    const res = await revokeAccess("p1");
    expect(res.ok).toBe(true);
    expect(db.purchase.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "p1" }, data: { revokedAt: expect.any(Date) } }),
    );
    expect(db.watchSession.updateMany).toHaveBeenCalled();
  });
});

describe("revokeOrderAccess", () => {
  it("revokes every purchase on the order", async () => {
    db.purchase.findMany.mockResolvedValue([{ id: "p1" }, { id: "p2" }]);
    db.purchase.findUnique.mockResolvedValue({ userId: "u1", videoId: null });
    db.purchase.update.mockResolvedValue({});
    const res = await revokeOrderAccess("o1");
    expect(res.ok).toBe(true);
    expect(db.purchase.update).toHaveBeenCalledTimes(2);
  });
});
