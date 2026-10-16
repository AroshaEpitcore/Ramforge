import { can, canAll, canAny, type Permission } from "@/lib/rbac";
import type { SessionUser } from "@/types";
import type { ReactNode } from "react";

interface CanProps {
  user: Pick<SessionUser, "role"> | null | undefined;
  /** Single permission to check. */
  permission?: Permission;
  /** Require all of these permissions. */
  all?: Permission[];
  /** Require any of these permissions. */
  any?: Permission[];
  children: ReactNode;
  /** Rendered when the check fails. */
  fallback?: ReactNode;
}

/**
 * Conditionally render UI based on the user's permissions.
 *
 * ```tsx
 * <Can user={user} permission="orders:refund">
 *   <RefundButton />
 * </Can>
 * ```
 *
 * Note: this is a UI convenience only. Always enforce with
 * `requirePermission()` on the server for anything that mutates data.
 */
export function Can({ user, permission, all, any, children, fallback = null }: CanProps) {
  const allowed =
    (permission ? can(user, permission) : true) &&
    (all ? canAll(user, all) : true) &&
    (any ? canAny(user, any) : true);

  return <>{allowed ? children : fallback}</>;
}
