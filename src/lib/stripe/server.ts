import "server-only";

import { env } from "@/lib/env";
import Stripe from "stripe";

/**
 * Server-side Stripe client. Instantiated lazily-safe (no network at import).
 * Supports cards, Apple Pay and Google Pay via Checkout/Payment Element.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  typescript: true,
  appInfo: { name: "Ramforge" },
});

export interface CheckoutLineInput {
  name: string;
  /** Unit amount in minor units. */
  amountMinor: number;
  quantity?: number;
}

/**
 * Create a Checkout Session (stub). Wire this to a real action that also
 * persists the Order and the cancellation-waiver consent before redirecting.
 */
export async function createCheckoutSession(_input: {
  lines: CheckoutLineInput[];
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  waiverConsent: boolean;
}): Promise<{ id: string; url: string | null }> {
  // TODO: stripe.checkout.sessions.create({ ... mode: "payment", line_items, ... })
  throw new Error("createCheckoutSession is not implemented in the scaffold.");
}
