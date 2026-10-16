import { CookieBanner } from "@/components/layout/cookie-banner";
import { StorefrontFooter } from "@/components/layout/storefront-footer";
import { StorefrontNavbar } from "@/components/layout/storefront-navbar";
import { getCurrentUser } from "@/server/current-user";
import type { ReactNode } from "react";

export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <StorefrontNavbar user={user} />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
      <CookieBanner />
    </div>
  );
}
