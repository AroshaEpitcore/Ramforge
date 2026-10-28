import { beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => ({
  db: { purchase: { upsert: vi.fn() } },
}));
vi.mock("@/server/db", () => ({ db }));

import { grantAccess } from "./entitlements";

beforeEach(() => {
  vi.clearAllMocks();
  db.purchase.upsert.mockResolvedValue({ id: "p1" });
});

describe("grantAccess", () => {
  it("rejects a grant with neither a video nor a course", async () => {
    const res = await grantAccess({ userId: "u1" });
    expect(res.ok).toBe(false);
    expect(db.purchase.upsert).not.toHaveBeenCalled();
  });

  it("grants a course entitlement (upsert on user+course+type)", async () => {
    const res = await grantAccess({ userId: "u1", courseId: "c1", orderId: "o1" });
    expect(res.ok).toBe(true);
    expect(db.purchase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_courseId_type: { userId: "u1", courseId: "c1", type: "STREAM" } },
        create: expect.objectContaining({ courseId: "c1", orderId: "o1", revokedAt: null }),
      }),
    );
  });

  it("grants a video entitlement (upsert on user+video+type)", async () => {
    const res = await grantAccess({ userId: "u1", videoId: "v1" });
    expect(res.ok).toBe(true);
    expect(db.purchase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_videoId_type: { userId: "u1", videoId: "v1", type: "STREAM" } },
      }),
    );
  });

  it("sets an expiry for a rental grant", async () => {
    await grantAccess({ userId: "u1", videoId: "v1", type: "RENTAL", rentalDays: 7 });
    const arg = db.purchase.upsert.mock.calls[0][0];
    expect(arg.create.expiresAt).toBeInstanceOf(Date);
    expect(arg.create.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
