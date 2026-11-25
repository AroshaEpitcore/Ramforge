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
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <FileText className="size-5 text-primary" /> Read the full article
              </h2>
              <Link
                href={post.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                <Download className="size-4" /> Open PDF
              </Link>
            </div>
            <object
              data={post.pdfUrl}
              type="application/pdf"
              className="h-[80vh] w-full rounded-xl border"
              aria-label={`${post.title} (PDF)`}
            >
              <p className="p-4 text-sm text-muted-foreground">
                Your browser can’t display the PDF inline.{" "}
                <Link href={post.pdfUrl} className="text-primary hover:underline">
                  Open it in a new tab
                </Link>
                .
              </p>
            </object>
          </section>
        )}
      </article>
    </Container>
  );
}
