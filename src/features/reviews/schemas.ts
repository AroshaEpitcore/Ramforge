import { z } from "zod";

/** Customer review submission (shared client/server). */
export const reviewSchema = z.object({
  videoId: z.string().min(1),
  rating: z.number().int().min(1, "Pick a rating").max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(1, "Write a short review").max(2000),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
