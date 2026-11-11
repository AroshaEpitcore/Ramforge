import { z } from "zod";

/** Donation ("buy us a coffee") input. Amount is in MINOR units (e.g. cents). */
export const donationSchema = z.object({
  // $1 min, $1000 max — generous but guards against fat-finger / abuse.
  amountMinor: z.number().int().min(100, "Minimum is $1").max(100000, "Maximum is $1000"),
  supporterName: z.string().trim().max(80).optional(),
  message: z.string().trim().max(280).optional(),
});
export type DonationInput = z.infer<typeof donationSchema>;
