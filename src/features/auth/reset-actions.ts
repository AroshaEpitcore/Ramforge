"use server";

import { MIN_PASSWORD_LENGTH } from "@/config/constants";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email/mailer";
import { db } from "@/server/db";
import { hashPassword } from "@/server/services/password";
import type { ActionResult } from "@/types";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});
const resetSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  token: z.string().min(1),
  password: z.string().min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`),
});

/**
 * Begin a password reset. Always returns success (never reveals whether an
 * email is registered). When the user exists, a short-lived token is stored
 * (hashed) and a reset link is emailed.
 */
export async function requestPasswordReset(raw: unknown): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Enter a valid email address." };
  const { email } = parsed.data;

  try {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      const rawToken = randomBytes(32).toString("hex");
      await db.verificationToken.deleteMany({ where: { identifier: email } });
      await db.verificationToken.create({
        data: {
          identifier: email,
          token: hashToken(rawToken),
          expires: new Date(Date.now() + RESET_TTL_MS),
        },
      });
      const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
      const link = `${base}/reset-password?email=${encodeURIComponent(email)}&token=${rawToken}`;
      await sendEmail({
        to: email,
        subject: "Reset your FrameForge password",
        html: `<p>We received a request to reset your password.</p>
<p><a href="${link}">Reset your password</a> (link expires in 1 hour).</p>
<p>If you didn't request this, you can ignore this email.</p>`,
      });
    }
    return { ok: true, data: undefined };
  } catch {
    // Still return ok to avoid leaking account existence / errors.
    return { ok: true, data: undefined };
  }
}

/** Complete a password reset using the emailed token. */
export async function resetPassword(raw: unknown): Promise<ActionResult> {
  const parsed = resetSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }
  const { email, token, password } = parsed.data;

  try {
    const record = await db.verificationToken.findUnique({
      where: { identifier_token: { identifier: email, token: hashToken(token) } },
    });
    if (!record || record.expires < new Date()) {
      return { ok: false, error: "This reset link is invalid or has expired." };
    }

    await db.user.update({
      where: { email },
      data: { passwordHash: await hashPassword(password) },
    });
    await db.verificationToken.deleteMany({ where: { identifier: email } });
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      await db.activityLog.create({
        data: { userId: user.id, action: "user.password_reset", entity: "User", entityId: user.id },
      });
    }
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "Could not reset your password. Please try again." };
  }
}
