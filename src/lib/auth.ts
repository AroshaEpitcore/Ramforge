import { authConfig } from "@/lib/auth.config";
import { db } from "@/server/db";
import { verifyPassword } from "@/server/services/password";
import type { Role } from "@/types";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

/**
 * Auth.js (NextAuth v5) — full config for the Node.js runtime (route handler +
 * server actions). Extends the edge-safe base (`auth.config.ts`) with the
 * Credentials provider, whose `authorize` verifies real users against Prisma.
 *
 * Credentials requires the JWT session strategy (set in the base config); the
 * `jwt`/`session` callbacks there propagate `uid` + `role`.
 */
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            passwordHash: true,
          },
        });

        // Verify even when the user is missing, to keep timing uniform and avoid
        // leaking which emails are registered.
        const ok = await verifyPassword(password, user?.passwordHash);
        if (!user || !ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role as Role,
        };
      },
    }),
  ],
});
