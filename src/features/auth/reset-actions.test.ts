import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

const { db } = vi.hoisted(() => ({
  db: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    verificationToken: { findUnique: vi.fn(), deleteMany: vi.fn(), create: vi.fn() },
    activityLog: { create: vi.fn() },
  },
}));
vi.mock("@/server/db", () => ({ db }));
vi.mock("@/server/services/password", () => ({
  hashPassword: vi.fn(async () => "hashed"),
  MIN_PASSWORD_LENGTH: 8,
}));
vi.mock("@/lib/email/mailer", () => ({ sendEmail: vi.fn(async () => ({ ok: true })) }));
vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_APP_URL: "http://localhost:3000" } }));

import { requestPasswordReset, resetPassword } from "./reset-actions";

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

beforeEach(() => {
  vi.clearAllMocks();
  db.verificationToken.deleteMany.mockResolvedValue({});
  db.verificationToken.create.mockResolvedValue({});
  db.user.update.mockResolvedValue({});
  db.activityLog.create.mockResolvedValue({});
});

describe("requestPasswordReset", () => {
  it("returns ok and does nothing for an unknown email (no enumeration)", async () => {
    db.user.findUnique.mockResolvedValue(null);
    const res = await requestPasswordReset({ email: "nobody@x.com" });
    expect(res.ok).toBe(true);
    expect(db.verificationToken.create).not.toHaveBeenCalled();
  });

  it("stores a hashed token for a known email", async () => {
    db.user.findUnique.mockResolvedValue({ id: "u1" });
    const res = await requestPasswordReset({ email: "jane@x.com" });
    expect(res.ok).toBe(true);
    expect(db.verificationToken.create).toHaveBeenCalled();
    const arg = db.verificationToken.create.mock.calls[0][0];
    expect(arg.data.token).toHaveLength(64); // sha256 hex
  });
});

describe("resetPassword", () => {
  it("rejects an invalid token", async () => {
    db.verificationToken.findUnique.mockResolvedValue(null);
    const res = await resetPassword({ email: "jane@x.com", token: "bad", password: "longenough" });
    expect(res.ok).toBe(false);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("rejects an expired token", async () => {
    db.verificationToken.findUnique.mockResolvedValue({ expires: new Date("2020-01-01") });
    const res = await resetPassword({ email: "jane@x.com", token: "t", password: "longenough" });
    expect(res.ok).toBe(false);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("resets the password for a valid, unexpired token", async () => {
    db.verificationToken.findUnique.mockResolvedValue({ expires: new Date(Date.now() + 100000) });
    db.user.findUnique.mockResolvedValue({ id: "u1" });
    const res = await resetPassword({ email: "jane@x.com", token: "good", password: "longenough" });
    expect(res.ok).toBe(true);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "jane@x.com" }, data: { passwordHash: "hashed" } }),
    );
    expect(db.verificationToken.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { identifier_token: { identifier: "jane@x.com", token: hash("good") } },
      }),
    );
  });
});
