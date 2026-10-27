import { describe, expect, it } from "vitest";
import { resolveVideoAccess, type OwnedEntitlement } from "./entitlements";

const paidVideo = { accessMode: "PAID" as const, videoId: "v1", courseId: "c1" };
const freeVideo = { accessMode: "FREE" as const, videoId: "v2", courseId: null };

const ent = (over: Partial<OwnedEntitlement>): OwnedEntitlement => ({
  type: "STREAM",
  expiresAt: null,
  revokedAt: null,
  videoId: null,
  courseId: null,
  ...over,
});

describe("resolveVideoAccess (the one MVP access rule)", () => {
  it("allows FREE videos with no entitlement and no sign-in", () => {
    expect(resolveVideoAccess(freeVideo, []).allowed).toBe(true);
  });

  it("denies a PAID video when the user owns nothing", () => {
    const d = resolveVideoAccess(paidVideo, []);
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("NO_ENTITLEMENT");
  });

  it("allows a PAID video the user owns directly", () => {
    expect(resolveVideoAccess(paidVideo, [ent({ videoId: "v1" })]).allowed).toBe(true);
  });

  it("allows a PAID lesson when the user owns its course", () => {
    expect(resolveVideoAccess(paidVideo, [ent({ courseId: "c1" })]).allowed).toBe(true);
  });

  it("denies when the matching entitlement is revoked", () => {
    const d = resolveVideoAccess(paidVideo, [ent({ courseId: "c1", revokedAt: new Date() })]);
    expect(d.allowed).toBe(false);
  });

  it("denies when the entitlement has expired (rental)", () => {
    const yesterday = new Date(Date.now() - 86_400_000);
    const d = resolveVideoAccess(paidVideo, [ent({ videoId: "v1", expiresAt: yesterday })]);
    expect(d.allowed).toBe(false);
  });

  it("does not match a course entitlement for a different course", () => {
    expect(resolveVideoAccess(paidVideo, [ent({ courseId: "other" })]).allowed).toBe(false);
  });
});
