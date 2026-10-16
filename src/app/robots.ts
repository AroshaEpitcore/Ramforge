import { siteConfig } from "@/config/site";
import type { MetadataRoute } from "next";

const base = siteConfig.url.replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/api", "/watch", "/dev"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
