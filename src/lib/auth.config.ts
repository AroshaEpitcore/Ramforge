import { env } from "@/lib/env";
import type { Role } from "@/types";
import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe base Auth.js config.
 *
 * This file must NOT import Prisma, bcrypt, or any Node-only module: it is used
 * by `middleware.ts`, which runs on the Edge runtime. The Credentials provider
 * (whose `authorize` talks to the database) is added only in `lib/auth.ts`,
 * which runs in the Node.js route handler / server actions.
 *
 * Both instances share this `secret` + `callbacks`, so a JWT minted on sign-in
 * (Node side) decodes with the same claims when the middleware reads it.
 */
export const authConfig = {
  secret: env.AUTH_SECRET,
  // Trust the deployment host (required on Vercel/proxied hosts where AUTH_URL
  // isn't set) to avoid NextAuth's `UntrustedHost` error on /api/auth/*.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
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
