import { z } from "zod";

/**
 * Admin content schemas (shared client/server). Kept free of
 * transforms/defaults/coerce so the zod input and output types match and
 * `react-hook-form` stays happy. Normalisation (empty-string → null, slug
 * derivation, price → minor units) happens in the server action.
 *
 * Prices are entered in MAJOR units (e.g. dollars); number inputs register with
 * `valueAsNumber`, so these are plain `z.number()`.
 */
const status = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Enter a name").max(80),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(500).optional(),
  parentId: z.string().optional(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const courseSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Enter a title").max(120),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().min(1, "Enter a description").max(2000),
  categoryId: z.string().optional(),
  priceMajor: z.number().min(0, "Price cannot be negative").max(100000),
  status,
  publishAt: z.string().optional(),
});
export type CourseInput = z.infer<typeof courseSchema>;

export const videoSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().min(2, "Enter a title").max(120),
    slug: z.string().trim().max(80).optional(),
    description: z.string().trim().min(1, "Enter a description").max(2000),
    categoryId: z.string().min(1, "Choose a category"),
    courseId: z.string().optional(),
    position: z.number().int().min(0).max(999),
    source: z.enum(["YOUTUBE", "MUX"]),
    youtubeId: z.string().trim().max(32).optional(),
    fullAssetId: z.string().trim().max(200).optional(),
    accessMode: z.enum(["FREE", "PAID"]),
    priceMajor: z.number().min(0).max(100000),
    status,
    publishAt: z.string().optional(),
    notes: z.string().trim().max(5000).optional(),
  })
  .refine((v) => v.source !== "YOUTUBE" || !!(v.youtubeId && v.youtubeId.length), {
    message: "A YouTube video id is required for YouTube videos",
    path: ["youtubeId"],
  });
export type VideoInput = z.infer<typeof videoSchema>;

export const reorderLessonsSchema = z.object({
  courseId: z.string().min(1),
  videoIds: z.array(z.string().min(1)).min(1),
});
export type ReorderLessonsInput = z.infer<typeof reorderLessonsSchema>;

export const bundleSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Enter a title").max(120),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().min(1, "Enter a description").max(2000),
  thumbnailUrl: z.string().trim().optional(),
  priceMajor: z.number().min(0).max(100000),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  videoIds: z.array(z.string()),
});
export type BundleInput = z.infer<typeof bundleSchema>;

export const bannerSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Enter a title").max(120),
  subtitle: z.string().trim().max(200).optional(),
  eyebrow: z.string().trim().max(60).optional(),
  imageUrl: z.string().trim().url("Enter an image URL"),
  ctaLabel: z.string().trim().max(40).optional(),
  ctaHref: z.string().trim().max(200).optional(),
  position: z.number().int().min(0).max(999),
  active: z.boolean(),
});
export type BannerInput = z.infer<typeof bannerSchema>;

export const emailTemplateSchema = z.object({
  id: z.string().optional(),
  key: z.string().trim().min(2, "Enter a key").max(60),
  name: z.string().trim().min(2, "Enter a name").max(120),
  subject: z.string().trim().min(1, "Enter a subject").max(200),
  body: z.string().trim().min(1, "Enter the body").max(10000),
});
export type EmailTemplateInput = z.infer<typeof emailTemplateSchema>;

export const couponSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(2, "Enter a code").max(40),
  type: z.enum(["PERCENT", "FIXED"]),
  // PERCENT: 0–100; FIXED: MAJOR units (converted to minor in the action).
  amount: z.number().min(0, "Enter an amount").max(100000),
  active: z.boolean(),
  // 0 / empty → unlimited.
  maxRedemptions: z.number().int().min(0).max(1_000_000),
  expiresAt: z.string().optional(),
});
export type CouponInput = z.infer<typeof couponSchema>;
