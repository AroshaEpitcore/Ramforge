import { Container } from "@/components/layout/container";
import { PlaceholderPage } from "@/components/shared/placeholder";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildMetadata({ title: slug.replace(/-/g, " ") });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Container className="max-w-3xl py-10">
      <PlaceholderPage
        title={slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        description="Individual blog article."
        backHref="/blog"
        backLabel="Back to blog"
      />
    </Container>
  );
}
