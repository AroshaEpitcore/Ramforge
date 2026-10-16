import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Type-safe, validated environment variables.
 *
 * - `server` vars are only available in server code (Server Components, route
 *   handlers, server actions). Importing them in a Client Component throws.
 * - `client` vars must be prefixed with `NEXT_PUBLIC_` and are safe to ship.
 *
 * SCAFFOLD NOTE: required vars fall back to **safe placeholder defaults** so the
 * app builds and runs on mock data without any secrets configured (e.g. a first
 * Vercel deploy). Override every placeholder with real values in production —
 * the defaults are insecure and non-functional. Tighten these to hard
 * requirements (remove the `.default(...)`) once real services are wired.
 *
 * Set `SKIP_ENV_VALIDATION=1` to bypass validation entirely.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // Database (Prisma + PostgreSQL). Prisma reads DATABASE_URL directly via the
    // schema; this entry only validates its presence/shape.
    DATABASE_URL: z
      .string()
      .url()
      .default("postgresql://user:password@localhost:5432/ramforge?schema=public"),

    // Auth.js (NextAuth v5)
    AUTH_SECRET: z.string().min(1).default("dev-insecure-secret-change-me-in-production"),
    AUTH_URL: z.string().url().optional(),

    // Stripe (server-side)
    STRIPE_SECRET_KEY: z.string().min(1).default("stripe-secret-key-not-set"),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).default("stripe-webhook-secret-not-set"),

    // Transactional email
    EMAIL_FROM: z.string().email().optional(),
    RESEND_API_KEY: z.string().optional(),

    // Video hosting provider (not chosen yet — defaults to the in-repo mock).
    VIDEO_PROVIDER: z.enum(["mock", "mux", "cloudflare", "bunny"]).default("mock"),
    VIDEO_SIGNING_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).default("stripe-publishable-key-not-set"),
  },
  /**
   * Destructure here so Next.js can statically inline `NEXT_PUBLIC_*` values.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    EMAIL_FROM: process.env.EMAIL_FROM,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    VIDEO_PROVIDER: process.env.VIDEO_PROVIDER,
    VIDEO_SIGNING_KEY: process.env.VIDEO_SIGNING_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
