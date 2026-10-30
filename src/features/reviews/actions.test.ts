import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, requireCurrentUser } = vi.hoisted(() => ({
  db: {
    video: { findUnique: vi.fn() },
    review: { upsert: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
  requireCurrentUser: vi.fn(),
}));
vi.mock("@/server/db", () => ({ db }));
vi.mock("@/server/current-user", () => ({ requireCurrentUser }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { approveReview, deleteReview, submitReview } from "./actions";

const customer = { id: "u1", role: "CUSTOMER", name: "U", email: "u@x.com" };
const admin = { id: "a1", role: "SUPER_ADMIN", name: "A", email: "a@x.com" };

beforeEach(() => vi.clearAllMocks());

describe("submitReview", () => {
  it("requires sign-in", async () => {
    requireCurrentUser.mockRejectedValue(new Error("UNAUTHENTICATED"));
    const res = await submitReview({ videoId: "v1", rating: 5, body: "Great" });
    expect(res.ok).toBe(false);
    expect(db.review.upsert).not.toHaveBeenCalled();
  });

  it("rejects an out-of-range rating before any DB call", async () => {
    const res = await submitReview({ videoId: "v1", rating: 0, body: "x" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.rating?.length).toBeGreaterThan(0);
    expect(requireCurrentUser).not.toHaveBeenCalled();
  });

  it("creates an unapproved review", async () => {
    requireCurrentUser.mockResolvedValue(customer);
    db.video.findUnique.mockResolvedValue({ slug: "v", status: "PUBLISHED" });
    db.review.upsert.mockResolvedValue({});
    const res = await submitReview({ videoId: "v1", rating: 4, title: "Nice", body: "Loved it" });
    expect(res.ok).toBe(true);
    expect(db.review.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { videoId_userId: { videoId: "v1", userId: "u1" } },
        create: expect.objectContaining({ approved: false, rating: 4 }),
      }),
    );
  });
});

describe("approveReview", () => {
  it("forbids a non-moderator", async () => {
    requireCurrentUser.mockResolvedValue(customer);
    const res = await approveReview("r1");
    expect(res.ok).toBe(false);
    expect(db.review.update).not.toHaveBeenCalled();
  });

  it("approves for a moderator", async () => {
    requireCurrentUser.mockResolvedValue(admin);
    db.review.update.mockResolvedValue({ video: { slug: "v" } });
    const res = await approveReview("r1");
    expect(res.ok).toBe(true);
    expect(db.review.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "r1" }, data: { approved: true } }),
    );
  });
});

describe("deleteReview", () => {
  it("forbids a non-moderator", async () => {
    requireCurrentUser.mockResolvedValue(customer);
    const res = await deleteReview("r1");
    expect(res.ok).toBe(false);
    expect(db.review.delete).not.toHaveBeenCalled();
  });

  it("deletes for a moderator", async () => {
    requireCurrentUser.mockResolvedValue(admin);
    db.review.delete.mockResolvedValue({ video: { slug: "v" } });
    const res = await deleteReview("r1");
    expect(res.ok).toBe(true);
    expect(db.review.delete).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "r1" } }));
  });
});
