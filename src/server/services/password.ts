import "server-only";

import { MIN_PASSWORD_LENGTH } from "@/config/constants";
import bcrypt from "bcryptjs";

export { MIN_PASSWORD_LENGTH };

/**
 * Password hashing (bcrypt). Chosen over argon2 for the scaffold because it is
 * pure-JS (no native build step on Windows/CI) and runs in the Node route
 * handler where `authorize()` executes — never in edge middleware.
 *
 * Cost factor 12 is a reasonable 2026 default (~250ms/hash). Raise as hardware
 * allows. To migrate to argon2id later, swap this module's two functions; the
 * stored hash format is self-describing so a staged rehash-on-login is possible.
 */
const BCRYPT_COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(
  plain: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}
