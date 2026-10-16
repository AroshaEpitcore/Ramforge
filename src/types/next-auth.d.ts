import type { Role } from "@/types";
import type { DefaultSession } from "next-auth";

// Augment NextAuth types so `session.user.role` is strongly typed (no `any`).
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    uid?: string;
  }
}
