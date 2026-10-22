import { BlogList } from "@/components/home/blog-list";
import { Container } from "@/components/layout/container";
import { buildMetadata } from "@/lib/seo";
import { mockBlogPosts } from "@/mocks";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Blog",
  description: "Tutorials, news and tips from the FrameForge team.",
});

export default function BlogPage() {
  return (
    <Container className="max-w-3xl py-10">
      <div className="mb-6 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
        <p className="text-muted-foreground">News, guides and behind-the-scenes.</p>
      </div>
      <BlogList posts={[...mockBlogPosts, ...mockBlogPosts]} />
    </Container>
  );
}
