import "server-only";

import { env } from "@/lib/env";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send a transactional email via Resend (HTTP API, no SDK dependency).
 *
 * If `RESEND_API_KEY` is not configured the email is logged instead of sent, so
 * the app works in development and the flows (purchase confirmation, password
 * reset) are testable without an email provider.
 */
export async function sendEmail(message: EmailMessage): Promise<{ ok: boolean }> {
  const from = env.EMAIL_FROM ?? "no-reply@frameforge.test";

  if (!env.RESEND_API_KEY) {
    console.info(`[email:dev] to=${message.to} subject=${message.subject}`);
    return { ok: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ from, to: message.to, subject: message.subject, html: message.html }),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
