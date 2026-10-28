import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, requireCurrentUser } = vi.hoisted(() => ({
  db: {
    favourite: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
  },
  requireCurrentUser: vi.fn(),
}));
vi.mock("@/server/db", () => ({ db }));
vi.mock("@/server/current-user", () => ({ requireCurrentUser }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { toggleFavourite } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  requireCurrentUser.mockResolvedValue({ id: "u1" });
});

describe("toggleFavourite", () => {
  it("requires sign-in", async () => {
    requireCurrentUser.mockRejectedValue(new Error("UNAUTHENTICATED"));
    const res = await toggleFavourite("v1");
    expect(res.ok).toBe(false);
  });

  it("adds a favourite when not present", async () => {
    db.favourite.findUnique.mockResolvedValue(null);
    db.favourite.create.mockResolvedValue({});
    const res = await toggleFavourite("v1");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.favourited).toBe(true);
    expect(db.favourite.create).toHaveBeenCalled();
  });

  it("removes a favourite when already present", async () => {
    db.favourite.findUnique.mockResolvedValue({ userId: "u1" });
    db.favourite.delete.mockResolvedValue({});
    const res = await toggleFavourite("v1");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.favourited).toBe(false);
    expect(db.favourite.delete).toHaveBeenCalled();
  });
});
