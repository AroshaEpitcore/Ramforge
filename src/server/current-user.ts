import "server-only";

import { mockUser } from "@/mocks";
import type { Role, SessionUser } from "@/types";

/**
 * Resolve the current user for Server Components.
 *
 * SCAFFOLD BEHAVIOUR: returns a mock customer so every layout renders a
 * realistic signed-in experience without a configured database/session.
 *
 * To make this real, replace the body with:
 * ```ts
 * import { auth } from "@/lib/auth";
 * const session = await auth();
 * return session?.user ?? null;
 * ```
 * (Reading the session is dynamic; wrap consumers in Suspense where needed.)
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  return mockUser;
}

/** Like {@link getCurrentUser} but previews a specific role (scaffold helper). */
export async function getCurrentUserAs(role: Role): Promise<SessionUser> {
  return { ...mockUser, role };
}
