/**
 * Database seed. Idempotent (uses upserts) so it is safe to re-run.
 *
 *   pnpm db:seed            # runs `tsx prisma/seed.ts` (see package.json)
 *
 * Requires a reachable database (DATABASE_URL). Creates a SUPER_ADMIN and a
 * CUSTOMER, a couple of categories, one free YouTube video and a sample course
 * with a free first lesson and paid later lessons.
 *
 * Default credentials (change after first login):
 *   admin@frameforge.test   / ChangeMe!2026
 *   customer@frameforge.test/ ChangeMe!2026
 */
import bcrypt from "bcryptjs";
import { PrismaClient, type Prisma } from "../src/generated/prisma";

const db = new PrismaClient();
const DEMO_PASSWORD = "ChangeMe!2026";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const admin = await db.user.upsert({
    where: { email: "admin@frameforge.test" },
    update: { role: "SUPER_ADMIN" },
    create: {
      email: "admin@frameforge.test",
      name: "FrameForge Admin",
      role: "SUPER_ADMIN",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  await db.user.upsert({
    where: { email: "customer@frameforge.test" },
    update: {},
    create: {
      email: "customer@frameforge.test",
      name: "Casey Customer",
      role: "CUSTOMER",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  const compositing = await db.category.upsert({
    where: { slug: "compositing" },
    update: {},
    create: {
      name: "Compositing",
      slug: "compositing",
      description: "Nuke, After Effects & more.",
    },
  });
  await db.category.upsert({
    where: { slug: "3d-vfx" },
    update: {},
    create: { name: "3D & VFX", slug: "3d-vfx", description: "Houdini, Blender, simulations." },
  });

  // A standalone FREE video hosted on YouTube (no Mux cost).
  await db.video.upsert({
    where: { slug: "intro-to-compositing" },
    update: {},
    create: {
      title: "Intro to Compositing",
      slug: "intro-to-compositing",
      description: "A free overview of the compositing pipeline.",
      tags: ["compositing", "beginner"],
      categoryId: compositing.id,
      source: "YOUTUBE",
      youtubeId: "dQw4w9WgXcQ",
      accessMode: "FREE",
      status: "PUBLISHED",
      publishedAt: new Date(),
      durationSec: 600,
      uploadStatus: "READY",
      uploadedById: admin.id,
    },
  });

  // A course: lesson 1 free, lessons 2–3 paid. Paid lessons have no Mux asset
  // yet (upload later); they remain DRAFT until an asset is attached.
  const course = await db.course.upsert({
    where: { slug: "nuke-foundations" },
    update: {},
    create: {
      title: "Nuke Foundations",
      slug: "nuke-foundations",
      description: "Learn node-based compositing in Nuke, from first principles.",
      categoryId: compositing.id,
      price: 4900,
      status: "PUBLISHED",
      publishAt: new Date(),
    },
  });

  const lessons: Prisma.VideoCreateInput[] = [
    {
      title: "Lesson 1 — The Node Graph (free preview)",
      slug: "nuke-foundations-1",
      description: "How Nuke's node graph works.",
      tags: ["nuke"],
      category: { connect: { id: compositing.id } },
      course: { connect: { id: course.id } },
      position: 1,
      source: "YOUTUBE",
      youtubeId: "dQw4w9WgXcQ",
      accessMode: "FREE",
      status: "PUBLISHED",
      publishedAt: new Date(),
      durationSec: 720,
      uploadStatus: "READY",
      uploadedBy: { connect: { id: admin.id } },
    },
    {
      title: "Lesson 2 — Merges & Roto",
      slug: "nuke-foundations-2",
      description: "Combining images and rotoscoping.",
      tags: ["nuke"],
      category: { connect: { id: compositing.id } },
      course: { connect: { id: course.id } },
      position: 2,
      source: "MUX",
      accessMode: "PAID",
      status: "DRAFT",
      durationSec: 1500,
      uploadStatus: "PENDING",
      uploadedBy: { connect: { id: admin.id } },
    },
    {
      title: "Lesson 3 — Keying",
      slug: "nuke-foundations-3",
      description: "Green-screen keying techniques.",
      tags: ["nuke"],
      category: { connect: { id: compositing.id } },
      course: { connect: { id: course.id } },
      position: 3,
      source: "MUX",
      accessMode: "PAID",
      status: "DRAFT",
      durationSec: 1800,
      uploadStatus: "PENDING",
      uploadedBy: { connect: { id: admin.id } },
    },
  ];

  for (const lesson of lessons) {
    await db.video.upsert({
      where: { slug: lesson.slug },
      update: {},
      create: lesson,
    });
  }

  // Payments off at launch (pricing UI hidden until flipped).
  await db.setting.upsert({
    where: { key: "payments.enabled" },
    update: {},
    create: { key: "payments.enabled", value: false },
  });

  console.log("Seed complete. Admin: admin@frameforge.test / " + DEMO_PASSWORD);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
