import { CookieBanner } from "@/components/layout/cookie-banner";
import { StorefrontFooter } from "@/components/layout/storefront-footer";
import { StorefrontNavbar } from "@/components/layout/storefront-navbar";
import { Snow } from "@/components/shared/snow";
import { getCurrentUser } from "@/server/current-user";
import { isSnowEnabled } from "@/server/services/settings";
import type { ReactNode } from "react";

export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  const [user, snow] = await Promise.all([getCurrentUser(), isSnowEnabled().catch(() => false)]);

  return (
    <div className="flex min-h-dvh flex-col">
      <StorefrontNavbar user={user} />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
      <CookieBanner />
      <Snow enabled={snow} />
    </div>
  );
}
