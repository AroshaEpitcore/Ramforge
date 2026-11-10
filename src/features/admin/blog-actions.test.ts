import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Exhaustive coverage of `saveBlogPost` / `deleteBlogPost` — adding and
 * managing blog posts every way the form allows. Mirrors the mock harness used
 * by the other admin-action tests; the real `@/lib/slug` runs.
 */
const { db, requireCurrentUser } = vi.hoisted(() => ({
  db: {
    blogPost: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
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
import { deleteBlogPost, saveBlogPost } from "./blog-actions";

const admin = { id: "a1", role: "SUPER_ADMIN", name: "A", email: "a@x.com" };
const customer = { id: "c1", role: "CUSTOMER", name: "C", email: "c@x.com" };

const post = (over: Record<string, unknown> = {}) => ({
  title: "Hello World",
  excerpt: "A short teaser",
  body: "The article body.",
  coverImageUrl: "",
  status: "DRAFT" as const,
  ...over,
});

const createdData = () => db.blogPost.create.mock.calls[0][0].data;
const updatedData = () => db.blogPost.update.mock.calls[0][0].data;

beforeEach(() => {
  vi.clearAllMocks();
  requireCurrentUser.mockResolvedValue(admin);
  db.blogPost.create.mockResolvedValue({ id: "p_new" });
  db.blogPost.update.mockResolvedValue({ id: "p_edit" });
  db.blogPost.delete.mockResolvedValue({});
});

describe("saveBlogPost · create", () => {
  it("creates a post attributed to the author with a derived slug", async () => {
    const res = await saveBlogPost(post());
    expect(res.ok).toBe(true);
    expect(createdData()).toMatchObject({ slug: "hello-world", authorId: "a1" });
  });

  it("slugifies an explicit slug", async () => {
    await saveBlogPost(post({ slug: "My Custom Slug!" }));
    expect(createdData().slug).toBe("my-custom-slug");
  });

  it("stores a cover image when given, nulls it when blank", async () => {
    await saveBlogPost(post({ coverImageUrl: "https://img.test/x.jpg" }));
    expect(createdData().coverImageUrl).toBe("https://img.test/x.jpg");

    vi.clearAllMocks();
    db.blogPost.create.mockResolvedValue({ id: "p" });
    await saveBlogPost(post({ coverImageUrl: "" }));
    expect(createdData().coverImageUrl).toBeNull();
  });
});

describe("saveBlogPost · status", () => {
  it("PUBLISHED stamps publishedAt", async () => {
    await saveBlogPost(post({ status: "PUBLISHED" }));
    expect(createdData().publishedAt).toBeInstanceOf(Date);
  });

  it("DRAFT leaves publishedAt null", async () => {
    await saveBlogPost(post({ status: "DRAFT" }));
    expect(createdData().publishedAt).toBeNull();
  });

  it("ARCHIVED leaves publishedAt null", async () => {
    await saveBlogPost(post({ status: "ARCHIVED" }));
    expect(createdData().publishedAt).toBeNull();
  });

  it("parses a scheduled publishAt, blanks become null", async () => {
    await saveBlogPost(post({ publishAt: "2027-02-01T09:00" }));
    expect(createdData().publishAt).toBeInstanceOf(Date);

    vi.clearAllMocks();
    db.blogPost.create.mockResolvedValue({ id: "p" });
    await saveBlogPost(post({ publishAt: "  " }));
    expect(createdData().publishAt).toBeNull();
  });
});

describe("saveBlogPost · update", () => {
  it("updates by id without reassigning the author", async () => {
    const res = await saveBlogPost(post({ id: "p_edit", title: "Edited" }));
    expect(res.ok).toBe(true);
    expect(db.blogPost.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "p_edit" } }),
    );
    expect(updatedData()).not.toHaveProperty("authorId");
    expect(db.blogPost.create).not.toHaveBeenCalled();
  });
});

describe("saveBlogPost · validation", () => {
  it("rejects a too-short title", async () => {
    const res = await saveBlogPost(post({ title: "x" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.title?.length).toBeGreaterThan(0);
    expect(db.blogPost.create).not.toHaveBeenCalled();
  });

  it("rejects an empty excerpt", async () => {
    const res = await saveBlogPost(post({ excerpt: "" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.excerpt?.length).toBeGreaterThan(0);
  });

  it("rejects an empty body", async () => {
    const res = await saveBlogPost(post({ body: "" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.body?.length).toBeGreaterThan(0);
  });

  it("rejects a malformed cover image URL", async () => {
    const res = await saveBlogPost(post({ coverImageUrl: "not-a-url" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.coverImageUrl?.length).toBeGreaterThan(0);
  });
});

describe("saveBlogPost · permissions & errors", () => {
  it("is forbidden for a customer", async () => {
    requireCurrentUser.mockResolvedValue(customer);
    const res = await saveBlogPost(post());
    expect(res.ok).toBe(false);
    expect(db.blogPost.create).not.toHaveBeenCalled();
  });

  it("maps a duplicate-slug error to a slug field error", async () => {
    const Ctor = Prisma.PrismaClientKnownRequestError as unknown as new (
      m: string,
    ) => Error & { code?: string };
    const err = new Ctor("dup");
    err.code = "P2002";
    db.blogPost.create.mockRejectedValue(err);
    const res = await saveBlogPost(post());
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.slug?.length).toBeGreaterThan(0);
  });
});

describe("deleteBlogPost", () => {
  it("deletes for an authorised user", async () => {
    expect((await deleteBlogPost("p1")).ok).toBe(true);
    expect(db.blogPost.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
  });

  it("is forbidden for a customer", async () => {
    requireCurrentUser.mockResolvedValue(customer);
    expect((await deleteBlogPost("p1")).ok).toBe(false);
    expect(db.blogPost.delete).not.toHaveBeenCalled();
  });
});
