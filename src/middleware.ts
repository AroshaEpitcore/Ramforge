import { authConfig } from "@/lib/auth.config";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";

/**
 * Route protection for `/admin` and `/account`.
 *
 * Runs on the Edge runtime, so it builds its own NextAuth instance from the
 * edge-safe `authConfig` (no Prisma/bcrypt). It only *reads* the JWT session;
 * sign-in happens in the Node route handler (`lib/auth.ts`).
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = Boolean(req.auth?.user);
  const isAdminArea = nextUrl.pathname.startsWith("/admin");
  const isAccountArea = nextUrl.pathname.startsWith("/account");

  if ((isAdminArea || isAccountArea) && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin area additionally requires a staff (non-customer) role.
  if (isAdminArea && req.auth?.user?.role === "CUSTOMER") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
