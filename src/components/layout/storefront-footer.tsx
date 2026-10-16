import { Logo } from "@/components/shared/logo";
import { NewsletterForm } from "@/components/shared/newsletter-form";
import { siteConfig } from "@/config/site";
import { footerNav } from "@/config/nav";
import { AtSign, PlaySquare, Rss } from "lucide-react";
import Link from "next/link";

const social = [
  { href: siteConfig.links.twitter, label: "Twitter", icon: AtSign },
  { href: siteConfig.links.youtube, label: "YouTube", icon: PlaySquare },
  { href: siteConfig.links.github, label: "GitHub", icon: Rss },
];

// Computed once at module load (build time) so it isn't a render-time
// current-time read, which Next's `cacheComponents` prerender disallows.
const currentYear = new Date().getFullYear();

export function StorefrontFooter() {
  return (
    <footer className="border-t bg-card/40">
      <div className="mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_2fr]">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="max-w-sm text-sm text-muted-foreground">{siteConfig.description}</p>
            <div className="mt-2">
              <p className="mb-2 text-sm font-medium">Get new releases in your inbox</p>
              <NewsletterForm className="max-w-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {footerNav.map((group) => (
              <div key={group.label}>
                <h3 className="mb-3 text-sm font-semibold">{group.label}</h3>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {currentYear} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            {social.map(({ href, label, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
