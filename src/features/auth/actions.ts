"use server";

import { changePasswordSchema, registerSchema, updateProfileSchema } from "@/features/auth/schemas";
import { db } from "@/server/db";
import { requireCurrentUser } from "@/server/current-user";
import { hashPassword, verifyPassword } from "@/server/services/password";
import type { ActionResult } from "@/types";
import { z } from "zod";

/** Build a typed failure, optionally with per-field messages. */
function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Flatten a zod error into the `fieldErrors` shape the forms consume. */
function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

/**
 * Register a new customer account.
 * Server-side: validates input, detects duplicate emails, hashes the password,
 * stores the user as CUSTOMER, and records an activity-log entry.
 */
export async function registerUser(
  raw: unknown,
): Promise<ActionResult<{ id: string; email: string }>> {
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", zodFieldErrors(parsed.error));
  }
  const { name, email, password } = parsed.data;

  try {
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return fail("That email is already registered.", {
        email: ["That email is already registered."],
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: { name, email, passwordHash, role: "CUSTOMER" },
      select: { id: true, email: true },
    });

    await db.activityLog.create({
      data: { userId: user.id, action: "user.register", entity: "User", entityId: user.id },
    });

    return { ok: true, data: user };
  } catch {
    // Guard against a race on the unique email (two concurrent sign-ups).
    return fail("Could not create your account. Please try again.");
  }
}

/**
 * Change the signed-in user's password. Verifies the current password before
 * setting the new one.
 */
export async function changePassword(raw: unknown): Promise<ActionResult> {
  let userId: string;
  try {
    userId = (await requireCurrentUser()).id;
  } catch {
    return fail("You must be signed in.");
  }

  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", zodFieldErrors(parsed.error));
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    const ok = await verifyPassword(parsed.data.current, user?.passwordHash);
    if (!ok) {
      return fail("Your current password is incorrect.", {
        current: ["Your current password is incorrect."],
      });
    }

    await db.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(parsed.data.next) },
    });
    await db.activityLog.create({
      data: { userId, action: "user.password_change", entity: "User", entityId: userId },
    });

    return { ok: true, data: undefined };
  } catch {
    return fail("Could not update your password. Please try again.");
  }
}

/** Update the signed-in user's name and email. */
export async function updateProfile(
  raw: unknown,
): Promise<ActionResult<{ name: string; email: string }>> {
  let userId: string;
  try {
    userId = (await requireCurrentUser()).id;
  } catch {
    return fail("You must be signed in.");
  }

  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", zodFieldErrors(parsed.error));
  }
  const { name, email } = parsed.data;

  try {
    const clash = await db.user.findFirst({
      where: { email, NOT: { id: userId } },
      select: { id: true },
    });
    if (clash) {
      return fail("That email is already in use.", {
        email: ["That email is already in use."],
      });
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { name, email },
      select: { name: true, email: true },
    });
    await db.activityLog.create({
      data: { userId, action: "user.profile_update", entity: "User", entityId: userId },
    });

    return { ok: true, data: { name: user.name ?? "", email: user.email } };
  } catch {
    return fail("Could not update your profile. Please try again.");
  }
}
