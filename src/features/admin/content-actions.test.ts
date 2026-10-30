import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, requireCurrentUser, setSetting } = vi.hoisted(() => ({
  db: {
    course: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    video: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    newsletterSubscriber: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
  requireCurrentUser: vi.fn(),
  setSetting: vi.fn(),
}));
vi.mock("@/server/db", () => ({ db }));
vi.mock("@/server/current-user", () => ({ requireCurrentUser }));
vi.mock("@/server/services/settings", () => ({
  setSetting,
  SETTING_KEYS: { paymentsEnabled: "payments.enabled", vatRatePercent: "tax.vatRatePercent" },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/generated/prisma", () => ({
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

import {
  deleteVideo,
  exportNewsletterCsv,
  reorderLessons,
  saveCourse,
  saveVideo,
  setPaymentsEnabled,
  setVatRate,
} from "./actions";

const admin = { id: "a1", role: "SUPER_ADMIN", name: "A", email: "a@x.com" };
const customer = { id: "c1", role: "CUSTOMER", name: "C", email: "c@x.com" };

const video = (over = {}) => ({
  title: "Lesson 1",
  description: "A lesson",
  categoryId: "cat1",
  source: "YOUTUBE" as const,
  youtubeId: "dQw4w9WgXcQ",
  accessMode: "FREE" as const,
  position: 0,
  priceMajor: 0,
  rentalDays: 0,
  rentalPriceMajor: 0,
  status: "DRAFT" as const,
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  requireCurrentUser.mockResolvedValue(admin);
});

describe("saveCourse", () => {
  it("creates with a derived slug for an admin", async () => {
    db.course.create.mockResolvedValue({ id: "c1" });
    const res = await saveCourse({
      title: "Nuke Foundations",
      description: "d",
      priceMajor: 49,
      status: "PUBLISHED",
    });
    expect(res.ok).toBe(true);
    expect(db.course.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: "nuke-foundations", price: 4900 }),
      }),
    );
  });
  it("is forbidden for a customer", async () => {
    requireCurrentUser.mockResolvedValue(customer);
    expect(
      (await saveCourse({ title: "X Y", description: "d", priceMajor: 0, status: "DRAFT" })).ok,
    ).toBe(false);
    expect(db.course.create).not.toHaveBeenCalled();
  });
});

describe("saveVideo", () => {
  it("requires a youtube id for YouTube videos", async () => {
    const res = await saveVideo(video({ youtubeId: "" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.youtubeId?.length).toBeGreaterThan(0);
  });
  it("creates a video attributed to the uploader", async () => {
    db.video.create.mockResolvedValue({ id: "v1" });
    const res = await saveVideo(video());
    expect(res.ok).toBe(true);
    expect(db.video.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ uploadedById: "a1", youtubeId: "dQw4w9WgXcQ" }),
      }),
    );
  });
  it("stores price only for PAID videos", async () => {
    db.video.create.mockResolvedValue({ id: "v2" });
    await saveVideo(video({ accessMode: "PAID", priceMajor: 30, source: "MUX", youtubeId: "" }));
    expect(db.video.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ price: 3000 }) }),
    );
  });
});

describe("deleteVideo", () => {
  it("deletes for an admin", async () => {
    db.video.delete.mockResolvedValue({});
    expect((await deleteVideo("v1")).ok).toBe(true);
  });
  it("is forbidden for a customer", async () => {
    requireCurrentUser.mockResolvedValue(customer);
    expect((await deleteVideo("v1")).ok).toBe(false);
    expect(db.video.delete).not.toHaveBeenCalled();
  });
});

describe("reorderLessons", () => {
  it("updates positions inside a transaction (two passes)", async () => {
    db.$transaction.mockResolvedValue([]);
    db.video.update.mockReturnValue(Promise.resolve({}));
    const res = await reorderLessons({ courseId: "c1", videoIds: ["a", "b", "c"] });
    expect(res.ok).toBe(true);
    expect(db.video.update).toHaveBeenCalledTimes(6); // park + set for 3 lessons
  });
});

describe("settings actions", () => {
  it("setPaymentsEnabled persists the flag", async () => {
    setSetting.mockResolvedValue(undefined);
    expect((await setPaymentsEnabled(true)).ok).toBe(true);
    expect(setSetting).toHaveBeenCalledWith("payments.enabled", true);
  });
  it("setVatRate clamps to 0..100", async () => {
    setSetting.mockResolvedValue(undefined);
    await setVatRate(150);
    expect(setSetting).toHaveBeenCalledWith("tax.vatRatePercent", 100);
  });
  it("settings actions are forbidden for customers", async () => {
    requireCurrentUser.mockResolvedValue(customer);
    expect((await setPaymentsEnabled(true)).ok).toBe(false);
  });
});

describe("exportNewsletterCsv", () => {
  it("returns CSV text", async () => {
    db.newsletterSubscriber.findMany.mockResolvedValue([
      { email: "a@x.com", source: "footer", confirmed: false, createdAt: new Date("2026-01-01") },
    ]);
    const res = await exportNewsletterCsv();
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data).toContain("a@x.com");
  });
});
