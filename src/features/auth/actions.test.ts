import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the server-only data + crypto layers so the action runs without a DB.
// `vi.hoisted` lets the hoisted vi.mock factories reference these safely.
const { db } = vi.hoisted(() => ({
  db: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    activityLog: { create: vi.fn() },
  },
}));
vi.mock("@/server/db", () => ({ db }));
vi.mock("@/server/services/password", () => ({
  hashPassword: vi.fn(async () => "hashed-pw"),
  verifyPassword: vi.fn(),
  MIN_PASSWORD_LENGTH: 8,
}));
vi.mock("@/server/current-user", () => ({ requireCurrentUser: vi.fn() }));

import { registerUser } from "./actions";
import { hashPassword } from "@/server/services/password";

beforeEach(() => {
  vi.clearAllMocks();
  db.activityLog.create.mockResolvedValue({});
});

describe("registerUser", () => {
  it("creates a CUSTOMER with a hashed password and normalised email", async () => {
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue({ id: "u1", email: "jane@x.com" });

    const res = await registerUser({
      name: "Jane Doe",
      email: "  JANE@x.com ",
      password: "longenough",
    });

    expect(res.ok).toBe(true);
    expect(hashPassword).toHaveBeenCalledWith("longenough");
    expect(db.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "jane@x.com",
          role: "CUSTOMER",
          passwordHash: "hashed-pw",
        }),
      }),
    );
    expect(db.activityLog.create).toHaveBeenCalled();
  });

  it("rejects a duplicate email with a field error and does not create a user", async () => {
    db.user.findUnique.mockResolvedValue({ id: "existing" });

    const res = await registerUser({ name: "Jane", email: "jane@x.com", password: "longenough" });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.email?.[0]).toMatch(/already registered/i);
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("rejects a too-short password before touching the database", async () => {
    const res = await registerUser({ name: "Jane", email: "jane@x.com", password: "short" });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.password?.length).toBeGreaterThan(0);
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    const res = await registerUser({ name: "Jane", email: "not-an-email", password: "longenough" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.email?.length).toBeGreaterThan(0);
  });
});
