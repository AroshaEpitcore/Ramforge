import { AccountSidebar } from "@/components/layout/account-sidebar";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { StorefrontFooter } from "@/components/layout/storefront-footer";
import { StorefrontNavbar } from "@/components/layout/storefront-navbar";
import { Container } from "@/components/layout/container";
import { getCurrentUser } from "@/server/current-user";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/account");

  return (
    <div className="flex min-h-dvh flex-col">
      <StorefrontNavbar user={user} />
      <Container className="flex-1 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <AccountSidebar />
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </Container>
      <StorefrontFooter />
      <CookieBanner />
    </div>
  );
}
