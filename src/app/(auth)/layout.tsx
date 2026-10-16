import { Logo } from "@/components/shared/logo";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import type { ReactNode } from "react";

const currentYear = new Date().getFullYear();

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* Decorative branded backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,theme(colors.primary/15%),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:36px_36px]"
      />

      <div className="mb-8">
        <Logo />
      </div>

      <main className="w-full max-w-md">{children}</main>

      <footer className="mt-8 text-center text-xs text-muted-foreground">
        <p>
          © {currentYear} {siteConfig.name}. By continuing you agree to our{" "}
          <Link href="/legal/terms" className="underline-offset-4 hover:underline">
            Terms
          </Link>{" "}
          &amp;{" "}
          <Link href="/legal/privacy" className="underline-offset-4 hover:underline">
            Privacy
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
