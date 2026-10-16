import type { Role, SessionUser } from "@/types";

/**
 * Permission catalogue. Add new permissions here as `resource:action`.
 * UI and server code both consult this single map — never hard-code roles.
 */
export const PERMISSIONS = [
  // Catalog
  "videos:read",
  "videos:create",
  "videos:update",
  "videos:delete",
  "videos:publish",
  "videos:upload",
  "categories:manage",
  "bundles:manage",
  // Pricing & marketing
  "prices:update",
  "coupons:manage",
  "banners:manage",
  "emailTemplates:manage",
  // Orders & money
  "orders:read",
  "orders:refund",
  // Access control
  "access:grant",
  "access:revoke",
  "access:read",
  // People
  "customers:read",
  "reviews:moderate",
  "users:manage",
  "roles:manage",
  // Ops
  "reports:read",
  "activity:read",
  "settings:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: Permission[] = [...PERMISSIONS];

/**
 * Role → permissions. Derived from the project plan's role table:
 * - Super Admin: everything
 * - Store Manager: videos, prices, coupons, orders, refunds (+ catalog/marketing)
 * - Content Uploader: upload and edit videos only
 * - Support Staff: view orders, grant/revoke access
 * - Customer: no admin permissions
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: ALL,
  STORE_MANAGER: [
    "videos:read",
    "videos:create",
    "videos:update",
    "videos:delete",
    "videos:publish",
    "videos:upload",
    "categories:manage",
    "bundles:manage",
    "prices:update",
    "coupons:manage",
    "banners:manage",
    "emailTemplates:manage",
    "orders:read",
    "orders:refund",
    "access:grant",
    "access:revoke",
    "access:read",
    "customers:read",
    "reviews:moderate",
    "reports:read",
    "activity:read",
  ],
  CONTENT_UPLOADER: ["videos:read", "videos:create", "videos:update", "videos:upload"],
  SUPPORT_STAFF: ["orders:read", "access:grant", "access:revoke", "access:read", "customers:read"],
  CUSTOMER: [],
};

type UserLike = Pick<SessionUser, "role"> | { role: Role } | null | undefined;

/** True if the user's role grants the permission. */
export function can(user: UserLike, permission: Permission): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
}

/** True if the user has every listed permission. */
export function canAll(user: UserLike, permissions: Permission[]): boolean {
  return permissions.every((p) => can(user, p));
}

/** True if the user has any of the listed permissions. */
export function canAny(user: UserLike, permissions: Permission[]): boolean {
  return permissions.some((p) => can(user, p));
}

/** True if the role has any admin-area access at all. */
export function isStaff(user: UserLike): boolean {
  if (!user) return false;
  return user.role !== "CUSTOMER";
}

export class ForbiddenError extends Error {
  constructor(permission: Permission) {
    super(`Missing required permission: ${permission}`);
    this.name = "ForbiddenError";
  }
}

/**
 * Server-side guard. Throws `ForbiddenError` if the user lacks the permission.
 * Use at the top of server actions / route handlers after resolving the user.
 */
export function requirePermission(user: UserLike, permission: Permission): void {
  if (!can(user, permission)) throw new ForbiddenError(permission);
}
