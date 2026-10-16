import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Stripe webhook receiver. Verifies the signature, then routes events.
 * Grant/revoke logic is stubbed — wire to the entitlement service.
 *
 * Note: the raw request body is required for signature verification, so do not
 * parse it as JSON first.
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const body = await req.text();

  let event: import("stripe").Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      // TODO: mark Order paid, grantAccess() for each item, send "Watch now" email, issue invoice.
      break;
    case "charge.refunded":
      // TODO: revokeAccess() for the related entitlements (refund).
      break;
    default:
      // Unhandled event types are acknowledged so Stripe stops retrying.
      break;
  }

  return NextResponse.json({ received: true });
}
