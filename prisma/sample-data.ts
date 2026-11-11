/**
 * Demo sample-data enrichment. Idempotent (skips/upserts) so it is safe to
 * re-run and will not duplicate rows. Unlike `seed.ts` (which creates the
 * minimum to boot), this fills out the rest of the system for demos:
 *
 *   pnpm db:sample          # runs `tsx prisma/sample-data.ts`
 *
 * It enriches whatever catalog already exists:
 *   - gives every course two sections and assigns its lessons
 *   - upserts a standard set of transactional email templates
 *   - favourites a few videos for the demo customer
 *   - creates a couple of PAID sample orders (so Orders/Reports have data)
 *
 * Requires a reachable database (DATABASE_URL) with at least the base catalog
 * (run `pnpm db:seed` first on an empty database).
 */
import { PrismaClient } from "../src/generated/prisma";

const db = new PrismaClient();
const log = (...a: unknown[]) => console.log(...a);

async function main() {
  const customer =
    (await db.user.findFirst({ where: { email: "customer@frameforge.test" } })) ??
    (await db.user.findFirst({ where: { role: "CUSTOMER" } }));
  if (!customer) throw new Error("No customer user found — run `pnpm db:seed` first.");

  // 1) SECTIONS — give every course two sections and assign its lessons.
  const courses = await db.course.findMany({
    include: {
      sections: true,
      lessons: { orderBy: { position: "asc" }, select: { id: true } },
    },
  });
  for (const c of courses) {
    if (c.sections.length > 0) {
      log(`sections: '${c.slug}' already has ${c.sections.length} — skipping`);
      continue;
    }
    if (c.lessons.length === 0) continue;
    const s1 = await db.section.create({
      data: { courseId: c.id, title: "Section 1: Getting Started", position: 0 },
    });
    const s2 = await db.section.create({
      data: { courseId: c.id, title: "Section 2: Going Deeper", position: 1 },
    });
    await db.video.update({ where: { id: c.lessons[0].id }, data: { sectionId: s1.id } });
    for (const l of c.lessons.slice(1)) {
      await db.video.update({ where: { id: l.id }, data: { sectionId: s2.id } });
    }
    log(`sections: '${c.slug}' → created 2 sections, assigned ${c.lessons.length} lessons`);
  }

  // 2) EMAIL TEMPLATES — standard transactional set (upsert by key).
  const templates = [
    {
      key: "welcome",
      name: "Welcome",
      subject: "Welcome to FrameForge 🎬",
      body: "Hi {{name}},\n\nWelcome to FrameForge — your home for premium VFX, compositing and filmmaking tutorials.\n\nStart exploring the shop and build your library.\n\n— The FrameForge team",
    },
    {
      key: "order_confirmation",
      name: "Order confirmation",
      subject: "Your FrameForge order {{invoiceNumber}}",
      body: "Hi {{name}},\n\nThanks for your purchase! Your order {{invoiceNumber}} for {{total}} is confirmed and the content is now in your library.\n\nHappy watching,\nFrameForge",
    },
    {
      key: "password_reset",
      name: "Password reset",
      subject: "Reset your FrameForge password",
      body: "Hi {{name}},\n\nWe received a request to reset your password. Click the link below to choose a new one. If you didn't request this, you can ignore this email.\n\n{{resetUrl}}",
    },
    {
      key: "course_access_granted",
      name: "Course access granted",
      subject: "You've unlocked {{courseTitle}}",
      body: "Hi {{name}},\n\nYou now have full access to {{courseTitle}}, including every current and future lesson. Jump back in any time from your library.\n\n— FrameForge",
    },
    {
      key: "rental_expiring",
      name: "Rental expiring",
      subject: "Your rental of {{videoTitle}} expires soon",
      body: "Hi {{name}},\n\nHeads up — your rental of {{videoTitle}} expires on {{expiresAt}}. Finish watching before then, or buy it to keep forever.\n\n— FrameForge",
    },
  ];
  for (const t of templates) {
    await db.emailTemplate.upsert({
      where: { key: t.key },
      update: { name: t.name, subject: t.subject, body: t.body },
      create: t,
    });
  }
  log(`email templates: upserted ${templates.length}`);

  // 3) FAVOURITES — customer hearts a few published videos.
  const favVideos = await db.video.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 4,
    select: { id: true },
  });
  for (const v of favVideos) {
    await db.favourite.upsert({
      where: { userId_videoId: { userId: customer.id, videoId: v.id } },
      update: {},
      create: { userId: customer.id, videoId: v.id },
    });
  }
  log(`favourites: ensured ${favVideos.length} for ${customer.email}`);

  // 4) ORDERS — a couple of PAID sample orders (idempotent via invoiceNumber).
  const paidCourse = await db.course.findFirst({
    where: { price: { gt: 0 } },
    select: { id: true, price: true },
  });
  const paidVideo = await db.video.findFirst({
    where: { status: "PUBLISHED", accessMode: "PAID", price: { gt: 0 } },
    select: { id: true, price: true },
  });
  const paidBundle = await db.bundle.findFirst({
    where: { price: { gt: 0 } },
    select: { id: true, price: true },
  });

  type ItemPlan = {
    videoId?: string;
    courseId?: string;
    bundleId?: string;
    type: "STREAM";
    unitPrice: number;
  };
  const orderPlans: { invoiceNumber: string; items: ItemPlan[] }[] = [
    {
      invoiceNumber: "SMPL-1001",
      items: paidCourse
        ? [{ courseId: paidCourse.id, type: "STREAM", unitPrice: paidCourse.price }]
        : [],
    },
    {
      invoiceNumber: "SMPL-1002",
      items: [
        ...(paidVideo
          ? [{ videoId: paidVideo.id, type: "STREAM" as const, unitPrice: paidVideo.price }]
          : []),
        ...(paidBundle
          ? [{ bundleId: paidBundle.id, type: "STREAM" as const, unitPrice: paidBundle.price }]
          : []),
      ],
    },
  ];

  for (const plan of orderPlans) {
    if (plan.items.length === 0) continue;
    const existing = await db.order.findFirst({ where: { invoiceNumber: plan.invoiceNumber } });
    if (existing) {
      log(`order ${plan.invoiceNumber}: exists — skipping`);
      continue;
    }
    const subtotal = plan.items.reduce((s, i) => s + i.unitPrice, 0);
    const taxTotal = Math.round(subtotal * 0.2);
    await db.order.create({
      data: {
        userId: customer.id,
        status: "PAID",
        subtotal,
        taxTotal,
        total: subtotal + taxTotal,
        currency: "USD",
        waiverConsent: true,
        waiverConsentAt: new Date(),
        invoiceNumber: plan.invoiceNumber,
        items: { create: plan.items.map((i) => ({ ...i, quantity: 1 })) },
      },
    });
    log(`order ${plan.invoiceNumber}: created (total ${subtotal + taxTotal})`);
  }

  log("Sample-data enrichment complete.");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
