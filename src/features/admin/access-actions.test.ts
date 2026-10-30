import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, requireCurrentUser, grantAccess, revokeAccess } = vi.hoisted(() => ({
  db: { user: { findUnique: vi.fn() }, activityLog: { create: vi.fn() } },
  requireCurrentUser: vi.fn(),
  grantAccess: vi.fn(),
  revokeAccess: vi.fn(),
}));
vi.mock("@/server/db", () => ({ db }));
vi.mock("@/server/current-user", () => ({ requireCurrentUser }));
vi.mock("@/server/services/entitlements", () => ({ grantAccess, revokeAccess }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { manualGrantAccess, revokeGrant } from "./access-actions";

const admin = { id: "a1", role: "SUPER_ADMIN", name: "A", email: "a@x.com" };
const support = { id: "s1", role: "SUPPORT_STAFF", name: "S", email: "s@x.com" };
const customer = { id: "c1", role: "CUSTOMER", name: "C", email: "c@x.com" };

beforeEach(() => {
  vi.clearAllMocks();
  db.activityLog.create.mockResolvedValue({});
  grantAccess.mockResolvedValue({ ok: true, data: { id: "p1" } });
  revokeAccess.mockResolvedValue({ ok: true, data: undefined });
});

describe("manualGrantAccess", () => {
  it("requires exactly one of course or video (zod)", async () => {
    requireCurrentUser.mockResolvedValue(admin);
    const res = await manualGrantAccess({ email: "x@x.com", courseId: "c1", videoId: "v1" });
    expect(res.ok).toBe(false);
  });

  it("is forbidden for a customer", async () => {
    requireCurrentUser.mockResolvedValue(customer);
    const res = await manualGrantAccess({ email: "x@x.com", courseId: "c1" });
    expect(res.ok).toBe(false);
    expect(grantAccess).not.toHaveBeenCalled();
  });

  it("fails when the customer email is unknown", async () => {
    requireCurrentUser.mockResolvedValue(support);
    db.user.findUnique.mockResolvedValue(null);
    const res = await manualGrantAccess({ email: "nobody@x.com", courseId: "c1" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.email?.length).toBeGreaterThan(0);
  });

  it("grants access for support staff", async () => {
    requireCurrentUser.mockResolvedValue(support);
    db.user.findUnique.mockResolvedValue({ id: "u9" });
    const res = await manualGrantAccess({ email: "casey@x.com", courseId: "c1" });
    expect(res.ok).toBe(true);
    expect(grantAccess).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u9", courseId: "c1", grantedById: "s1" }),
    );
  });
});

describe("revokeGrant", () => {
  it("revokes for support staff", async () => {
    requireCurrentUser.mockResolvedValue(support);
    const res = await revokeGrant("p1");
    expect(res.ok).toBe(true);
    expect(revokeAccess).toHaveBeenCalledWith("p1");
  });
  it("is forbidden for a customer", async () => {
    requireCurrentUser.mockResolvedValue(customer);
    expect((await revokeGrant("p1")).ok).toBe(false);
    expect(revokeAccess).not.toHaveBeenCalled();
  });
});
