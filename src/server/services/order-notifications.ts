import "server-only";

import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email/mailer";
import { formatCurrency } from "@/lib/formatters";
import { db } from "@/server/db";

/** Email the buyer a purchase confirmation with a "Watch now" link. */
export async function sendPurchaseConfirmation(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      total: true,
      user: { select: { email: true } },
      items: {
        select: {
          course: { select: { title: true } },
          video: { select: { title: true } },
          bundle: { select: { title: true } },
        },
      },
    },
  });
  if (!order) return;

  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const items = order.items
    .map((i) => i.course?.title ?? i.video?.title ?? i.bundle?.title ?? "Item")
    .map((t) => `<li>${t}</li>`)
    .join("");

  await sendEmail({
    to: order.user.email,
    subject: "Your FrameForge purchase",
    html: `<p>Thanks for your purchase!</p>
<ul>${items}</ul>
<p>Total: ${formatCurrency(order.total)}</p>
<p><a href="${base}/account/library">Watch now</a></p>`,
  });
}
