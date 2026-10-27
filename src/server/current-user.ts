import "server-only";

import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";

/**
 * Resolve the current user for Server Components, layouts and server actions.
 * Reads the real Auth.js session (JWT). Returns `null` when signed out.
 *
 * Reading the session is dynamic, so consumers render dynamically (wrap in
 * Suspense where a static shell is desired).
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;

  return {
    id: user.id,
    name: user.name ?? "",
    email: user.email ?? "",
    image: user.image ?? null,
    role: user.role,
  };
}

/**
 * Like {@link getCurrentUser} but throws when signed out — use at the top of
 * protected server actions / route handlers after middleware has already
 * gated the route.
 */
export async function requireCurrentUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}
