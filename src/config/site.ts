import { env } from "@/lib/env";

/**
 * Single source of truth for brand + global site metadata.
 * Change `name` here to rebrand the entire app.
 */
export const siteConfig = {
  name: "FrameForge",
  tagline: "Learn. Create. Composite.",
  description:
    "Buy and watch premium VFX, compositing and filmmaking videos — stream, download or rent in HD and 4K.",
  url: env.NEXT_PUBLIC_APP_URL,
  ogImage: "/opengraph-image",
  locale: "en",
  // Default display currency (prices are stored as integer minor units).
  currency: "USD",
  supportEmail: "support@frameforge.test",
  links: {
    twitter: "https://twitter.com/frameforge",
    youtube: "https://youtube.com/@frameforge",
    github: "https://github.com/frameforge",
  },
} as const;

export type SiteConfig = typeof siteConfig;
