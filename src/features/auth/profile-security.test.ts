import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, requireCurrentUser, verifyPassword } = vi.hoisted(() => ({
  db: {
    user: { findUnique: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    activityLog: { create: vi.fn() },
  },
  requireCurrentUser: vi.fn(),
  verifyPassword: vi.fn(),
}));
vi.mock("@/server/db", () => ({ db }));
vi.mock("@/server/current-user", () => ({ requireCurrentUser }));
vi.mock("@/server/services/password", () => ({
  hashPassword: vi.fn(async () => "hashed"),
  verifyPassword,
  MIN_PASSWORD_LENGTH: 8,
}));

import { changePassword, updateProfile } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  requireCurrentUser.mockResolvedValue({ id: "u1", email: "u@x.com", name: "U", role: "CUSTOMER" });
  db.activityLog.create.mockResolvedValue({});
});

describe("changePassword", () => {
  it("requires sign-in", async () => {
    requireCurrentUser.mockRejectedValue(new Error("UNAUTHENTICATED"));
    expect(
      (await changePassword({ current: "a", next: "longenough", confirm: "longenough" })).ok,
    ).toBe(false);
  });

  it("rejects mismatched confirmation (zod)", async () => {
    const res = await changePassword({ current: "x", next: "longenough", confirm: "different" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.confirm?.length).toBeGreaterThan(0);
  });

  it("rejects a wrong current password", async () => {
    db.user.findUnique.mockResolvedValue({ passwordHash: "stored" });
    verifyPassword.mockResolvedValue(false);
    const res = await changePassword({
      current: "wrong",
      next: "longenough",
      confirm: "longenough",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.current?.length).toBeGreaterThan(0);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("updates the password when current is correct", async () => {
    db.user.findUnique.mockResolvedValue({ passwordHash: "stored" });
    verifyPassword.mockResolvedValue(true);
    db.user.update.mockResolvedValue({});
    const res = await changePassword({
      current: "right",
      next: "longenough",
      confirm: "longenough",
    });
    expect(res.ok).toBe(true);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { passwordHash: "hashed" } }),
    );
  });
});

describe("updateProfile", () => {
  it("rejects an email already in use by someone else", async () => {
    db.user.findFirst.mockResolvedValue({ id: "other" });
    const res = await updateProfile({ name: "Jane", email: "taken@x.com" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.email?.length).toBeGreaterThan(0);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("updates name and email", async () => {
    db.user.findFirst.mockResolvedValue(null);
    db.user.update.mockResolvedValue({ name: "Jane", email: "jane@x.com" });
    const res = await updateProfile({ name: "Jane", email: "jane@x.com" });
    expect(res.ok).toBe(true);
    expect(db.user.update).toHaveBeenCalled();
  });
});
