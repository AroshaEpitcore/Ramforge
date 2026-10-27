import { siteConfig } from "@/config/site";
import { mockBundles, mockCategories, mockVideos } from "@/mocks";
import { listPublishedCourseSlugs } from "@/server/queries/courses";
import type { MetadataRoute } from "next";

const base = siteConfig.url.replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes = [
    "",
    "/shop",
    "/courses",
    "/categories",
    "/bundles",
    "/blog",
    "/about",
    "/contact",
    "/faq",
    "/legal/privacy",
    "/legal/cookies",
    "/legal/terms",
    "/legal/refund-policy",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const videoRoutes = mockVideos.map((v) => ({
    url: `${base}/video/${v.slug}`,
    lastModified: v.publishedAt ? new Date(v.publishedAt) : now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const categoryRoutes = mockCategories.map((c) => ({
    url: `${base}/shop?category=${c.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const bundleRoutes = mockBundles.map((b) => ({
    url: `${base}/bundles/${b.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Real published courses (DB). Tolerate an unavailable DB so the sitemap and
  // build never fail on it.
  let courseRoutes: MetadataRoute.Sitemap = [];
  try {
    const slugs = await listPublishedCourseSlugs();
    courseRoutes = slugs.map((slug) => ({
      url: `${base}/courses/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    courseRoutes = [];
  }

  return [...staticRoutes, ...videoRoutes, ...categoryRoutes, ...bundleRoutes, ...courseRoutes];
}
