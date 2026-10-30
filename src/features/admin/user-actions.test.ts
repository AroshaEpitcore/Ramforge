import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, requireCurrentUser } = vi.hoisted(() => ({
  db: { user: { update: vi.fn() }, activityLog: { create: vi.fn() } },
  requireCurrentUser: vi.fn(),
}));
vi.mock("@/server/db", () => ({ db }));
vi.mock("@/server/current-user", () => ({ requireCurrentUser }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateUserRole } from "./user-actions";

const superAdmin = { id: "a1", role: "SUPER_ADMIN", name: "A", email: "a@x.com" };

beforeEach(() => {
  vi.clearAllMocks();
  db.activityLog.create.mockResolvedValue({});
  db.user.update.mockResolvedValue({});
});

describe("updateUserRole", () => {
  it("is forbidden for a non Super-Admin", async () => {
    requireCurrentUser.mockResolvedValue({
      id: "s1",
      role: "STORE_MANAGER",
      name: "S",
      email: "s@x.com",
    });
    const res = await updateUserRole({ userId: "u2", role: "STORE_MANAGER" });
    expect(res.ok).toBe(false);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("prevents changing your own role (lockout guard)", async () => {
    requireCurrentUser.mockResolvedValue(superAdmin);
    const res = await updateUserRole({ userId: "a1", role: "CUSTOMER" });
    expect(res.ok).toBe(false);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("rejects an invalid role", async () => {
    requireCurrentUser.mockResolvedValue(superAdmin);
    expect((await updateUserRole({ userId: "u2", role: "WIZARD" })).ok).toBe(false);
  });

  it("updates a user's role", async () => {
    requireCurrentUser.mockResolvedValue(superAdmin);
    const res = await updateUserRole({ userId: "u2", role: "CONTENT_UPLOADER" });
    expect(res.ok).toBe(true);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "u2" }, data: { role: "CONTENT_UPLOADER" } }),
    );
  });
});
