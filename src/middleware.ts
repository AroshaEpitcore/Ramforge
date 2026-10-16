import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Route protection for `/admin` and `/account`.
 *
 * SCAFFOLD: enforcement is gated by `AUTH_ENFORCED` so every layout stays
 * viewable before real sign-in is wired. Flip it to `true` once `authorize`
 * in lib/auth.ts verifies real users — the enforcement logic below is final.
 */
const AUTH_ENFORCED = false;

export default auth((req) => {
  if (!AUTH_ENFORCED) return NextResponse.next();

  const { nextUrl } = req;
  const isLoggedIn = Boolean(req.auth?.user);
  const isAdminArea = nextUrl.pathname.startsWith("/admin");
  const isAccountArea = nextUrl.pathname.startsWith("/account");

  if ((isAdminArea || isAccountArea) && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin area additionally requires a staff role.
  if (isAdminArea && req.auth?.user?.role === "CUSTOMER") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
