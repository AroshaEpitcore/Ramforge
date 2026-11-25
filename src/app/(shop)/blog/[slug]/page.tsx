import { Container } from "@/components/layout/container";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/formatters";
import { getPublishedBlogPostBySlug } from "@/server/queries/blog";
import { ArrowLeft, Download, FileText } from "lucide-react";
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

        {paragraphs.length > 0 && (
          <div className="space-y-4 text-base leading-relaxed text-foreground/90">
            {paragraphs.map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
          </div>
        )}

        {post.pdfUrl && (
          <section className="rounded-xl border bg-muted/30 p-5">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-6" />
                </div>
                <div>
                  <h2 className="font-semibold">Read the full article</h2>
                  <p className="text-sm text-muted-foreground">
                    Opens the PDF in your browser’s viewer.
                  </p>
                </div>
              </div>
              <Link
                href={post.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Download className="size-4" /> Open PDF
              </Link>
            </div>
          </section>
        )}
      </article>
    </Container>
  );
}
