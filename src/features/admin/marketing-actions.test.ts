import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, requireCurrentUser } = vi.hoisted(() => ({
  db: {
    banner: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    emailTemplate: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
  requireCurrentUser: vi.fn(),
}));
vi.mock("@/server/db", () => ({ db }));
vi.mock("@/server/current-user", () => ({ requireCurrentUser }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/generated/prisma", () => ({
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

import { deleteBanner, saveBanner, saveEmailTemplate } from "./marketing-actions";

const admin = { id: "a1", role: "SUPER_ADMIN", name: "A", email: "a@x.com" };
const customer = { id: "c1", role: "CUSTOMER", name: "C", email: "c@x.com" };

beforeEach(() => {
  vi.clearAllMocks();
  requireCurrentUser.mockResolvedValue(admin);
});

describe("saveBanner", () => {
  it("rejects an invalid image URL", async () => {
    const res = await saveBanner({
      title: "Hero",
      imageUrl: "not-a-url",
      position: 0,
      active: true,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.imageUrl?.length).toBeGreaterThan(0);
  });
  it("creates a banner", async () => {
    db.banner.create.mockResolvedValue({ id: "bn1" });
    const res = await saveBanner({
      title: "Hero",
      imageUrl: "https://x.com/a.jpg",
      position: 1,
      active: true,
    });
    expect(res.ok).toBe(true);
    expect(db.banner.create).toHaveBeenCalled();
  });
  it("is forbidden for a customer", async () => {
    requireCurrentUser.mockResolvedValue(customer);
    const res = await saveBanner({
      title: "Hero",
      imageUrl: "https://x.com/a.jpg",
      position: 0,
      active: true,
    });
    expect(res.ok).toBe(false);
  });
});

describe("saveEmailTemplate", () => {
  it("creates a template", async () => {
    db.emailTemplate.create.mockResolvedValue({ id: "t1" });
    const res = await saveEmailTemplate({
      key: "welcome",
      name: "Welcome",
      subject: "Hi",
      body: "Hello",
    });
    expect(res.ok).toBe(true);
  });
});

describe("deleteBanner", () => {
  it("deletes for an admin", async () => {
    db.banner.delete.mockResolvedValue({});
    expect((await deleteBanner("bn1")).ok).toBe(true);
  });
});
