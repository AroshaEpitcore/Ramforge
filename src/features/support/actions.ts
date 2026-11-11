"use server";

import { donationSchema } from "@/features/support/schemas";
import { siteConfig } from "@/config/site";
import { env } from "@/lib/env";
import { createCheckoutSession } from "@/lib/stripe/server";
import { db } from "@/server/db";
import type { ActionResult } from "@/types";
import { z } from "zod";

function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

const base = () => env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
const nullify = (v?: string | null) => (v && v.trim() ? v.trim() : null);

/**
 * Start a "buy us a coffee" donation. No account required: creates a PENDING
 * Donation, opens a one-off Stripe Checkout session tagged with the donationId
 * (the webhook flips it to PAID), and returns the hosted-checkout URL.
 */
export async function createDonationCheckout(raw: unknown): Promise<ActionResult<{ url: string }>> {
  const parsed = donationSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(
      "Please check the amount.",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }
  const { amountMinor, supporterName, message } = parsed.data;

  try {
    const donation = await db.donation.create({
      data: {
        amount: amountMinor,
        currency: siteConfig.currency,
        supporterName: nullify(supporterName),
        message: nullify(message),
        status: "PENDING",
      },
    });

    const session = await createCheckoutSession({
      lines: [{ name: `Buy ${siteConfig.name} a coffee ☕`, amountMinor, quantity: 1 }],
      successUrl: `${base()}/support?thanks=1`,
      cancelUrl: `${base()}/support`,
      metadata: { donationId: donation.id },
    });

    if (!session.url) return fail("Could not start checkout. Please try again.");
    await db.donation.update({
      where: { id: donation.id },
      data: { stripeCheckoutId: session.id },
    });
    return { ok: true, data: { url: session.url } };
  } catch (e) {
    // Never surface the raw Stripe error (it can echo the API key) to the client.
    console.error("createDonationCheckout failed", e);
    return fail("Could not start checkout right now. Please try again later.");
  }
}
