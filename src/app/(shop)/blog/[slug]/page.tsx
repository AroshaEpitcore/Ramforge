import { Container } from "@/components/layout/container";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/formatters";
import { getPublishedBlogPostBySlug } from "@/server/queries/blog";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) return buildMetadata({ title: "Post not found" });
  return buildMetadata({ title: post.title, description: post.excerpt });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) notFound();

  const paragraphs = post.body.split(/\n{2,}/).filter((p) => p.trim().length > 0);

  return (
    <Container className="max-w-3xl py-10">
      <Link
        href="/blog"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to blog
      </Link>

      <article className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{post.title}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(post.publishedAt)}
            {post.authorName ? ` · ${post.authorName}` : ""}
          </p>
        </header>

        {post.thumbnailUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border">
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}

        <div className="space-y-4 text-base leading-relaxed text-foreground/90">
          {paragraphs.map((para, i) => (
            <p key={i} className="whitespace-pre-line">
              {para}
            </p>
          ))}
        </div>
      </article>
    </Container>
  );
}
