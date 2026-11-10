import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Exhaustive coverage of `saveVideo` — "add a video, every possible way".
 *
 * Dimensions exercised: source (YOUTUBE / MUX), access mode (FREE / PAID),
 * rentals, lifecycle status (DRAFT / PUBLISHED / ARCHIVED), standalone vs.
 * course lesson, slug derivation, create vs. update, validation rejections,
 * permissions, and Prisma unique-constraint mapping.
 *
 * Mirrors the mock harness in `content-actions.test.ts`; the real `@/lib/slug`
 * runs so slug derivation is verified for real.
 */
const { db, requireCurrentUser } = vi.hoisted(() => ({
  db: {
    video: { create: vi.fn(), update: vi.fn() },
  },
  requireCurrentUser: vi.fn(),
}));
vi.mock("@/server/db", () => ({ db }));
vi.mock("@/server/current-user", () => ({ requireCurrentUser }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/generated/prisma", () => ({
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

import { Prisma } from "@/generated/prisma";
import { saveVideo } from "./actions";

const admin = { id: "a1", role: "SUPER_ADMIN", name: "A", email: "a@x.com" };
const customer = { id: "c1", role: "CUSTOMER", name: "C", email: "c@x.com" };

/** A valid create payload; override per case. */
const video = (over: Record<string, unknown> = {}) => ({
  title: "Lesson One",
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

/** The `data` object passed to the create call. */
const createdData = () => db.video.create.mock.calls[0][0].data;
const updatedData = () => db.video.update.mock.calls[0][0].data;

beforeEach(() => {
  vi.clearAllMocks();
  requireCurrentUser.mockResolvedValue(admin);
  db.video.create.mockResolvedValue({ id: "v_new" });
  db.video.update.mockResolvedValue({ id: "v_edit" });
});

// --- source: YOUTUBE vs MUX ------------------------------------------------

describe("saveVideo · source", () => {
  it("YOUTUBE stores the youtube id and nulls the mux asset", async () => {
    const res = await saveVideo(
      video({ source: "YOUTUBE", youtubeId: "abc123", fullAssetId: "X" }),
    );
    expect(res.ok).toBe(true);
    expect(createdData()).toMatchObject({
      youtubeId: "abc123",
      fullAssetId: null,
      source: "YOUTUBE",
    });
  });

  it("MUX stores the asset id and nulls the youtube id", async () => {
    const res = await saveVideo(
      video({ source: "MUX", youtubeId: "", fullAssetId: "asset_9", accessMode: "FREE" }),
    );
    expect(res.ok).toBe(true);
    expect(createdData()).toMatchObject({ source: "MUX", fullAssetId: "asset_9", youtubeId: null });
  });

  it("rejects a YOUTUBE video with no id (field error)", async () => {
    const res = await saveVideo(video({ youtubeId: "" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.youtubeId?.length).toBeGreaterThan(0);
    expect(db.video.create).not.toHaveBeenCalled();
  });

  it("MUX video needs no youtube id", async () => {
    const res = await saveVideo(video({ source: "MUX", youtubeId: "", fullAssetId: "asset_1" }));
    expect(res.ok).toBe(true);
  });
});

// --- access mode: FREE / PAID / rentals ------------------------------------

describe("saveVideo · access mode", () => {
  it("FREE forces price to 0 and rentals to null even if values are supplied", async () => {
    await saveVideo(
      video({ accessMode: "FREE", priceMajor: 42, rentalDays: 7, rentalPriceMajor: 5 }),
    );
    expect(createdData()).toMatchObject({ price: 0, rentalDays: null, rentalPrice: null });
  });

  it("PAID stores the price in minor units", async () => {
    await saveVideo(
      video({
        accessMode: "PAID",
        priceMajor: 29.99,
        source: "MUX",
        youtubeId: "",
        fullAssetId: "a",
      }),
    );
    expect(createdData().price).toBe(2999);
  });

  it("PAID with rentals stores rental days and rental price", async () => {
    await saveVideo(
      video({
        accessMode: "PAID",
        priceMajor: 40,
        rentalDays: 14,
        rentalPriceMajor: 9,
        source: "MUX",
        youtubeId: "",
        fullAssetId: "a",
      }),
    );
    expect(createdData()).toMatchObject({ rentalDays: 14, rentalPrice: 900 });
  });

  it("PAID with rental days but zero rental price leaves rental price null", async () => {
    await saveVideo(
      video({
        accessMode: "PAID",
        priceMajor: 40,
        rentalDays: 14,
        rentalPriceMajor: 0,
        source: "MUX",
        youtubeId: "",
        fullAssetId: "a",
      }),
    );
    expect(createdData()).toMatchObject({ rentalDays: 14, rentalPrice: null });
  });

  it("PAID with zero rental days is not rentable", async () => {
    await saveVideo(
      video({
        accessMode: "PAID",
        priceMajor: 40,
        rentalDays: 0,
        rentalPriceMajor: 9,
        source: "MUX",
        youtubeId: "",
        fullAssetId: "a",
      }),
    );
    expect(createdData()).toMatchObject({ rentalDays: null, rentalPrice: null });
  });
});

// --- lifecycle status ------------------------------------------------------

describe("saveVideo · status", () => {
  it("PUBLISHED stamps publishedAt", async () => {
    await saveVideo(video({ status: "PUBLISHED" }));
    expect(createdData().publishedAt).toBeInstanceOf(Date);
  });

  it("DRAFT leaves publishedAt null", async () => {
    await saveVideo(video({ status: "DRAFT" }));
    expect(createdData().publishedAt).toBeNull();
  });

  it("ARCHIVED leaves publishedAt null", async () => {
    await saveVideo(video({ status: "ARCHIVED" }));
    expect(createdData().publishedAt).toBeNull();
  });

  it("stores a scheduled publishAt date when provided", async () => {
    await saveVideo(video({ publishAt: "2027-01-01" }));
    expect(createdData().publishAt).toBeInstanceOf(Date);
  });

  it("blank publishAt becomes null", async () => {
    await saveVideo(video({ publishAt: "   " }));
    expect(createdData().publishAt).toBeNull();
  });
});

// --- standalone vs. course lesson ------------------------------------------

describe("saveVideo · course placement", () => {
  it("keeps the position when attached to a course", async () => {
    await saveVideo(video({ courseId: "course1", position: 5 }));
    expect(createdData()).toMatchObject({ courseId: "course1", position: 5 });
  });

  it("forces position 0 for a standalone video", async () => {
    await saveVideo(video({ courseId: "", position: 5 }));
    expect(createdData()).toMatchObject({ courseId: null, position: 0 });
  });
});

// --- slug derivation -------------------------------------------------------

describe("saveVideo · slug", () => {
  it("derives the slug from the title when none is given", async () => {
    await saveVideo(video({ title: "My First Lesson", slug: "" }));
    expect(createdData().slug).toBe("my-first-lesson");
  });

  it("slugifies an explicit slug", async () => {
    await saveVideo(video({ slug: "Custom Slug!" }));
    expect(createdData().slug).toBe("custom-slug");
  });
});

// --- create vs. update -----------------------------------------------------

describe("saveVideo · create vs update", () => {
  it("create attributes the video to the uploader", async () => {
    await saveVideo(video());
    expect(createdData().uploadedById).toBe("a1");
    expect(db.video.update).not.toHaveBeenCalled();
  });

  it("update targets the id and does not reassign the uploader", async () => {
    const res = await saveVideo(video({ id: "v_edit", title: "Edited Title" }));
    expect(res.ok).toBe(true);
    expect(db.video.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "v_edit" } }),
    );
    expect(updatedData()).not.toHaveProperty("uploadedById");
    expect(db.video.create).not.toHaveBeenCalled();
  });
});

// --- validation rejections -------------------------------------------------

describe("saveVideo · validation", () => {
  it("rejects a too-short title", async () => {
    const res = await saveVideo(video({ title: "x" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.title?.length).toBeGreaterThan(0);
  });

  it("rejects a missing category", async () => {
    const res = await saveVideo(video({ categoryId: "" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.categoryId?.length).toBeGreaterThan(0);
  });

  it("rejects an empty description", async () => {
    const res = await saveVideo(video({ description: "" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.description?.length).toBeGreaterThan(0);
  });

  it("rejects an unknown source", async () => {
    const res = await saveVideo(video({ source: "VIMEO" }));
    expect(res.ok).toBe(false);
    expect(db.video.create).not.toHaveBeenCalled();
  });
});

// --- permissions -----------------------------------------------------------

describe("saveVideo · permissions", () => {
  it("is forbidden for a customer", async () => {
    requireCurrentUser.mockResolvedValue(customer);
    const res = await saveVideo(video());
    expect(res.ok).toBe(false);
    expect(db.video.create).not.toHaveBeenCalled();
  });
});

// --- error mapping ---------------------------------------------------------

describe("saveVideo · error mapping", () => {
  it("maps a duplicate-slug Prisma error to a slug field error", async () => {
    // Prisma is mocked to `class extends Error {}`; cast the ctor to a simple
    // signature so this typechecks against the real generated type too.
    const Ctor = Prisma.PrismaClientKnownRequestError as unknown as new (
      m: string,
    ) => Error & { code?: string; meta?: { target: string[] } };
    const err = new Ctor("dup");
    err.code = "P2002";
    err.meta = { target: ["slug"] };
    db.video.create.mockRejectedValue(err);
    const res = await saveVideo(video());
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.slug?.length).toBeGreaterThan(0);
  });
});
