import { MIN_PASSWORD_LENGTH } from "@/config/constants";
import { z } from "zod";

/**
 * Auth zod schemas — shared between the client forms (UX validation) and the
 * server actions (authoritative validation). The server never trusts the
 * client, so these run again inside `defineAction`.
 */

const email = z.string().trim().toLowerCase().email("Enter a valid email");
const password = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email,
  password,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: password,
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email,
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
