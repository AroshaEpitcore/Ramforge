import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

const metadataBase = new URL(siteConfig.url);

/**
 * Build page metadata on top of shared OpenGraph/Twitter defaults.
 * Use in any route via `export const metadata = buildMetadata({ title, description })`
 * or inside `generateMetadata`.
 */
export function buildMetadata(overrides: Metadata = {}): Metadata {
  const title = overrides.title ?? siteConfig.name;
  const description = overrides.description ?? siteConfig.description;
  const resolvedTitle =
    typeof title === "string"
      ? title
      : title && "default" in title
        ? title.default
        : title && "absolute" in title
          ? title.absolute
          : siteConfig.name;

  return {
    metadataBase,
    title,
    description,
    applicationName: siteConfig.name,
    authors: [{ name: siteConfig.name }],
    keywords: ["video", "VFX", "compositing", "tutorials", "stream", "download", "4K", "HD"],
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: resolvedTitle,
      description: description ?? undefined,
      url: siteConfig.url,
      locale: siteConfig.locale,
      // Images come from the app/opengraph-image convention unless overridden.
      ...overrides.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: description ?? undefined,
      ...overrides.twitter,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    ...overrides,
  };
}
