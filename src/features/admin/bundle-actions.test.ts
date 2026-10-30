import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, tx, requireCurrentUser } = vi.hoisted(() => {
  const tx = {
    bundle: { create: vi.fn(), update: vi.fn() },
    bundleVideo: { deleteMany: vi.fn(), createMany: vi.fn() },
  };
  return {
    tx,
    db: {
      $transaction: vi.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
      bundle: { delete: vi.fn() },
    },
    requireCurrentUser: vi.fn(),
  };
});
vi.mock("@/server/db", () => ({ db }));
vi.mock("@/server/current-user", () => ({ requireCurrentUser }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/generated/prisma", () => ({
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

import { deleteBundle, saveBundle } from "./bundle-actions";

const admin = { id: "a1", role: "SUPER_ADMIN", name: "A", email: "a@x.com" };

beforeEach(() => {
  vi.clearAllMocks();
  requireCurrentUser.mockResolvedValue(admin);
  tx.bundle.create.mockResolvedValue({ id: "b1" });
  tx.bundleVideo.deleteMany.mockResolvedValue({});
  tx.bundleVideo.createMany.mockResolvedValue({});
});

describe("saveBundle", () => {
  it("creates a bundle and syncs its videos with positions", async () => {
    const res = await saveBundle({
      title: "Nuke Pack",
      description: "d",
      priceMajor: 99,
      status: "PUBLISHED",
      videoIds: ["v1", "v2"],
    });
    expect(res.ok).toBe(true);
    expect(tx.bundle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: "nuke-pack", price: 9900 }),
      }),
    );
    expect(tx.bundleVideo.deleteMany).toHaveBeenCalled();
    expect(tx.bundleVideo.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          { bundleId: "b1", videoId: "v1", position: 0 },
          { bundleId: "b1", videoId: "v2", position: 1 },
        ],
      }),
    );
  });

  it("is forbidden for a customer", async () => {
    requireCurrentUser.mockResolvedValue({
      id: "c1",
      role: "CUSTOMER",
      name: "C",
      email: "c@x.com",
    });
    const res = await saveBundle({
      title: "Pack",
      description: "d",
      priceMajor: 0,
      status: "DRAFT",
      videoIds: [],
    });
    expect(res.ok).toBe(false);
  });
});

describe("deleteBundle", () => {
  it("deletes for an admin", async () => {
    db.bundle.delete.mockResolvedValue({});
    expect((await deleteBundle("b1")).ok).toBe(true);
  });
});
