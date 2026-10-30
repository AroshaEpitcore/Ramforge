import { describe, expect, it, vi } from "vitest";

// Importing entitlements pulls in db.ts (constructs a Prisma client); mock it so
// no real connection is attempted for these pure-function tests.
vi.mock("@/server/db", () => ({ db: {} }));

import { canDownload, canWatch, isRentalExpired, type Entitlement } from "./entitlements";

const ent = (over: Partial<Entitlement> = {}): Entitlement => ({
  id: "p1",
  userId: "u1",
  videoId: "v1",
  type: "STREAM",
  expiresAt: null,
  downloadCount: 0,
  downloadLimit: null,
  revokedAt: null,
  ...over,
});

describe("isRentalExpired", () => {
  it("is false for non-rentals", () => {
    expect(isRentalExpired({ type: "STREAM", expiresAt: new Date(0) })).toBe(false);
  });
  it("is true when a rental is past expiry", () => {
    expect(isRentalExpired({ type: "RENTAL", expiresAt: new Date(Date.now() - 1000) })).toBe(true);
  });
  it("is false when a rental is still valid", () => {
    expect(isRentalExpired({ type: "RENTAL", expiresAt: new Date(Date.now() + 10000) })).toBe(
      false,
    );
  });
});

describe("canWatch", () => {
  it("denies with no entitlement", () => {
    expect(canWatch(null).allowed).toBe(false);
  });
  it("denies when revoked", () => {
    expect(canWatch(ent({ revokedAt: new Date() })).reason).toBe("REVOKED");
  });
  it("denies an expired rental", () => {
    expect(canWatch(ent({ type: "RENTAL", expiresAt: new Date(Date.now() - 1) })).reason).toBe(
      "RENTAL_EXPIRED",
    );
  });
  it("denies when the device limit is reached", () => {
    expect(canWatch(ent(), { activeSessions: 99 }).reason).toBe("DEVICE_LIMIT_REACHED");
  });
  it("allows a valid entitlement", () => {
    expect(canWatch(ent()).allowed).toBe(true);
  });
});

describe("canDownload", () => {
  it("requires a DOWNLOAD entitlement", () => {
    expect(canDownload(ent({ type: "STREAM" })).reason).toBe("DOWNLOAD_NOT_ALLOWED");
  });
  it("blocks when the download limit is reached", () => {
    expect(canDownload(ent({ type: "DOWNLOAD", downloadLimit: 3, downloadCount: 3 })).reason).toBe(
      "DOWNLOAD_LIMIT_REACHED",
    );
  });
  it("allows within the limit", () => {
    expect(canDownload(ent({ type: "DOWNLOAD", downloadLimit: 3, downloadCount: 1 })).allowed).toBe(
      true,
    );
  });
});
