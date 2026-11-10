import "server-only";

import { db } from "@/server/db";
import type { BlogPost } from "@/types";

/** Prisma `where` for publicly visible posts (mirrors lib/publishing.isPublished). */
function publishedWhere(now: Date = new Date()) {
  return {
    status: "PUBLISHED" as const,
    OR: [{ publishAt: null }, { publishAt: { lte: now } }],
  };
}

/** Fallback cover when a post has no image, so the list always renders cleanly. */
const coverFor = (slug: string, url: string | null) =>
  url ?? `https://picsum.photos/seed/${slug}/400/300`;

/** Published posts for the public blog index + homepage strip, newest first. */
export async function getPublishedBlogPosts(limit?: number): Promise<BlogPost[]> {
  const rows = await db.blogPost.findMany({
    where: publishedWhere(),
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    excerpt: p.excerpt,
    slug: p.slug,
    thumbnailUrl: coverFor(p.slug, p.coverImageUrl),
    publishedAt: (p.publishedAt ?? p.createdAt).toISOString(),
  }));
}

export interface BlogPostDetail extends BlogPost {
  body: string;
  authorName: string | null;
}

/** A single published post for `/blog/[slug]`. Null if missing or not public. */
export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  const p = await db.blogPost.findFirst({
    where: { slug, ...publishedWhere() },
    include: { author: { select: { name: true } } },
  });
  if (!p) return null;
  return {
    id: p.id,
    title: p.title,
    excerpt: p.excerpt,
    slug: p.slug,
    thumbnailUrl: coverFor(p.slug, p.coverImageUrl),
    publishedAt: (p.publishedAt ?? p.createdAt).toISOString(),
    body: p.body,
    authorName: p.author?.name ?? null,
  };
}

export interface AdminBlogPostRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImageUrl: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishAt: string | null;
  authorName: string | null;
  updatedAt: string;
}

/** All posts (any status) for the admin manager, newest first. */
export async function listBlogPostsForAdmin(): Promise<AdminBlogPostRow[]> {
  const rows = await db.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
    include: { author: { select: { name: true } } },
  });
  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    body: p.body,
    coverImageUrl: p.coverImageUrl,
    status: p.status,
    publishAt: p.publishAt ? p.publishAt.toISOString() : null,
    authorName: p.author?.name ?? null,
    updatedAt: p.updatedAt.toISOString(),
  }));
}
