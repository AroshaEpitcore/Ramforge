import { env } from "@/lib/env";
import type { Role } from "@/types";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Auth.js (NextAuth v5) configuration — scaffold/stub.
 *
 * Chosen over Better Auth for its mature App Router integration, large provider
 * ecosystem, and first-class middleware support (`auth` as a middleware
 * wrapper). See README for the full rationale.
 *
 * `authorize` is intentionally unimplemented: wire it to look up the user via
 * Prisma (`db.user`) and verify a password hash. To use database sessions,
 * add `@auth/prisma-adapter` (`adapter: PrismaAdapter(db)`) and switch the
 * strategy — Credentials requires the JWT strategy used here.
 */
export const authConfig = {
  secret: env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (_credentials) => {
        // TODO: const user = await db.user.findUnique(...); verify hash; return user.
        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = (user.role ?? "CUSTOMER") as Role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (typeof token.uid === "string") session.user.id = token.uid;
        session.user.role = (token.role ?? "CUSTOMER") as Role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
