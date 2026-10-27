import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, requireCurrentUser } = vi.hoisted(() => ({
  db: {
    category: { create: vi.fn(), update: vi.fn() },
  },
  requireCurrentUser: vi.fn(),
}));

vi.mock("@/server/db", () => ({ db }));
vi.mock("@/server/current-user", () => ({ requireCurrentUser }));
vi.mock("@/server/services/settings", () => ({
  SETTING_KEYS: { paymentsEnabled: "payments.enabled" },
  setSetting: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/generated/prisma", () => ({
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

import { saveCategory } from "./actions";

const admin = { id: "a1", role: "SUPER_ADMIN", name: "A", email: "a@x.com" };
const customer = { id: "c1", role: "CUSTOMER", name: "C", email: "c@x.com" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("saveCategory (authz + validation)", () => {
  it("rejects when not signed in", async () => {
    requireCurrentUser.mockRejectedValue(new Error("UNAUTHENTICATED"));
    const res = await saveCategory({ name: "Compositing" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/signed in/i);
    expect(db.category.create).not.toHaveBeenCalled();
  });

  it("rejects a CUSTOMER (lacks categories:manage)", async () => {
    requireCurrentUser.mockResolvedValue(customer);
    const res = await saveCategory({ name: "Compositing" });
    expect(res.ok).toBe(false);
    expect(db.category.create).not.toHaveBeenCalled();
  });

  it("returns field errors for an invalid name without touching the DB", async () => {
    const res = await saveCategory({ name: "a" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.name?.length).toBeGreaterThan(0);
    expect(requireCurrentUser).not.toHaveBeenCalled();
  });

  it("creates a category with a derived slug for an authorised admin", async () => {
    requireCurrentUser.mockResolvedValue(admin);
    db.category.create.mockResolvedValue({ id: "cat_1" });
    const res = await saveCategory({ name: "3D & VFX" });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.id).toBe("cat_1");
    expect(db.category.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug: "3d-vfx" }) }),
    );
  });
});
