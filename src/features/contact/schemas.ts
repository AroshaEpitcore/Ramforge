import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email address"),
  subject: z.string().min(3, "Add a short subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactValues = z.infer<typeof contactSchema>;
