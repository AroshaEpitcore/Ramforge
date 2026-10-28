import "server-only";

import { env } from "@/lib/env";
import { siteConfig } from "@/config/site";
import Stripe from "stripe";

/**
 * Server-side Stripe client. Instantiated lazily-safe (no network at import).
 * Supports cards, Apple Pay and Google Pay via Checkout/Payment Element.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  typescript: true,
  appInfo: { name: "FrameForge" },
});

export interface CheckoutLineInput {
  name: string;
  /** Unit amount in minor units. */
  amountMinor: number;
  quantity?: number;
}

/**
 * Create a Stripe Checkout Session (single or multiple line items). The caller
 * persists the PENDING Order first and passes its id in `metadata.orderId`, so
 * the webhook can mark it paid and grant access. Cards + Apple/Google Pay.
 */
export async function createCheckoutSession(input: {
  lines: CheckoutLineInput[];
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<{ id: string; url: string | null }> {
  const currency = siteConfig.currency.toLowerCase();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: input.lines.map((l) => ({
      quantity: l.quantity ?? 1,
      price_data: {
        currency,
        unit_amount: l.amountMinor,
        product_data: { name: l.name },
      },
    })),
    customer_email: input.customerEmail,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: input.metadata,
    // Surface the order id on the PaymentIntent too, for refund handling.
    payment_intent_data: input.metadata ? { metadata: input.metadata } : undefined,
  });
  return { id: session.id, url: session.url };
}
