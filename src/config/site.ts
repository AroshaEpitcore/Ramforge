import { env } from "@/lib/env";

/**
 * Single source of truth for brand + global site metadata.
 * Change `name` here to rebrand the entire app.
 */
export const siteConfig = {
  name: "Ramforge",
  tagline: "Learn. Practice. Master.",
  description:
    "Buy and watch premium VFX, compositing and filmmaking videos — stream, download or rent in HD and 4K.",
  url: env.NEXT_PUBLIC_APP_URL,
  ogImage: "/og.png",
  locale: "en",
  // Default display currency (prices are stored as integer minor units).
  currency: "USD",
  supportEmail: "support@ramforge.test",
  links: {
    twitter: "https://twitter.com/ramforge",
    youtube: "https://youtube.com/@ramforge",
    github: "https://github.com/ramforge",
  },
} as const;

export type SiteConfig = typeof siteConfig;
