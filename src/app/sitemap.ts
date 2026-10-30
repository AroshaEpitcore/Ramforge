import { siteConfig } from "@/config/site";
import { mockCategories } from "@/mocks";
import { listPublishedBundleSlugs } from "@/server/queries/bundles";
import { listPublishedCourseSlugs } from "@/server/queries/courses";
import { listPublishedVideoSlugs } from "@/server/queries/videos";
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

  let videoRoutes: MetadataRoute.Sitemap = [];
  try {
    const slugs = await listPublishedVideoSlugs();
    videoRoutes = slugs.map((slug) => ({
      url: `${base}/video/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    videoRoutes = [];
  }

  const categoryRoutes = mockCategories.map((c) => ({
    url: `${base}/shop?category=${c.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  let bundleRoutes: MetadataRoute.Sitemap = [];
  try {
    const slugs = await listPublishedBundleSlugs();
    bundleRoutes = slugs.map((slug) => ({
      url: `${base}/bundles/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    bundleRoutes = [];
  }

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
