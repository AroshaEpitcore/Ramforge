import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe/server";
import { db } from "@/server/db";
import { grantAccess, revokeOrderAccess } from "@/server/services/entitlements";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Stripe webhook receiver. Verifies the signature, dedupes by event id, then:
 *   - checkout.session.completed → mark the Order PAID + grant entitlements
 *   - charge.refunded           → mark the Order REFUNDED + revoke entitlements
 *
 * The raw body is required for signature verification, so it is read as text.
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

  // Idempotency: ignore an event id we've already processed.
  const seen = await db.processedWebhookEvent.findUnique({ where: { id: event.id } });
  if (seen) return NextResponse.json({ received: true, duplicate: true });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        const order = await db.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });
        if (order && order.status !== "PAID") {
          await db.order.update({
            where: { id: order.id },
            data: {
              status: "PAID",
              stripePaymentIntentId:
                typeof session.payment_intent === "string" ? session.payment_intent : null,
            },
          });
          for (const item of order.items) {
            if (item.courseId || item.videoId) {
              await grantAccess({
                userId: order.userId,
                courseId: item.courseId ?? undefined,
                videoId: item.videoId ?? undefined,
                type: item.type,
                orderId: order.id,
                rentalDays: item.rentalDays ?? undefined,
              });
            }
          }
        }
      }
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object;
      const paymentIntentId =
        typeof charge.payment_intent === "string" ? charge.payment_intent : null;
      if (paymentIntentId) {
        const order = await db.order.findFirst({
          where: { stripePaymentIntentId: paymentIntentId },
          select: { id: true },
        });
        if (order) {
          await db.order.update({ where: { id: order.id }, data: { status: "REFUNDED" } });
          await revokeOrderAccess(order.id);
        }
      }
    }

    await db.processedWebhookEvent
      .create({ data: { id: event.id, provider: "stripe", type: event.type } })
      .catch(() => {});
  } catch (err) {
    // Log and 500 so Stripe retries (grantAccess is idempotent, so retries are safe).
    console.error("Stripe webhook handler error", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
