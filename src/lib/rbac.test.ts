import { describe, expect, it } from "vitest";
import { ForbiddenError, can, canAll, canAny, isStaff, requirePermission } from "./rbac";

const superAdmin = { role: "SUPER_ADMIN" } as const;
const uploader = { role: "CONTENT_UPLOADER" } as const;
const customer = { role: "CUSTOMER" } as const;

describe("can", () => {
  it("grants super admin everything", () => {
    expect(can(superAdmin, "settings:manage")).toBe(true);
    expect(can(superAdmin, "orders:refund")).toBe(true);
  });

  it("restricts content uploader to video work", () => {
    expect(can(uploader, "videos:upload")).toBe(true);
    expect(can(uploader, "orders:refund")).toBe(false);
  });

  it("denies customers and null users", () => {
    expect(can(customer, "videos:create")).toBe(false);
    expect(can(null, "videos:create")).toBe(false);
  });
});

describe("canAll / canAny", () => {
  it("checks combinations", () => {
    expect(canAll(uploader, ["videos:read", "videos:upload"])).toBe(true);
    expect(canAll(uploader, ["videos:read", "orders:refund"])).toBe(false);
    expect(canAny(uploader, ["orders:refund", "videos:upload"])).toBe(true);
  });
});

describe("isStaff", () => {
  it("is false for customers and true for staff", () => {
    expect(isStaff(customer)).toBe(false);
    expect(isStaff(uploader)).toBe(true);
  });
});

describe("requirePermission", () => {
  it("throws ForbiddenError when lacking the permission", () => {
    expect(() => requirePermission(customer, "videos:create")).toThrow(ForbiddenError);
  });
  it("does not throw when permitted", () => {
    expect(() => requirePermission(superAdmin, "videos:create")).not.toThrow();
  });
});
