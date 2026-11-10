import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BlogList } from "./blog-list";
import { formatDate } from "@/lib/formatters";
import { mockBlogPosts } from "@/mocks";
import type { BlogPost } from "@/types";

/**
 * The blog is currently static (mock data + a placeholder article page), so the
 * testable surface is the `BlogList` presentation component and the integrity of
 * the mock data that feeds it.
 */
const posts: BlogPost[] = [
  {
    id: "p1",
    title: "First Post",
    excerpt: "e1",
    slug: "first-post",
    thumbnailUrl: "https://example.com/1.jpg",
    publishedAt: "2026-10-10",
  },
  {
    id: "p2",
    title: "Second Post",
    excerpt: "e2",
    slug: "second-post",
    thumbnailUrl: "https://example.com/2.jpg",
    publishedAt: "2026-09-01",
  },
];

describe("BlogList", () => {
  it("renders one link per post", () => {
    render(<BlogList posts={posts} />);
    expect(screen.getAllByRole("link")).toHaveLength(posts.length);
  });

  it("links each post to its slug route", () => {
    render(<BlogList posts={posts} />);
    expect(screen.getByRole("link", { name: /First Post/ })).toHaveAttribute(
      "href",
      "/blog/first-post",
    );
    expect(screen.getByRole("link", { name: /Second Post/ })).toHaveAttribute(
      "href",
      "/blog/second-post",
    );
  });

  it("shows each post title", () => {
    render(<BlogList posts={posts} />);
    expect(screen.getByText("First Post")).toBeInTheDocument();
    expect(screen.getByText("Second Post")).toBeInTheDocument();
  });

  it("formats the published date", () => {
    render(<BlogList posts={posts} />);
    expect(screen.getByText(formatDate("2026-10-10"))).toBeInTheDocument();
  });

  it("renders a thumbnail with the title as alt text", () => {
    render(<BlogList posts={[posts[0]]} />);
    const link = screen.getByRole("link");
    expect(within(link).getByAltText("First Post")).toBeInTheDocument();
  });

  it("renders an empty list when there are no posts", () => {
    render(<BlogList posts={[]} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("applies an extra className", () => {
    const { container } = render(<BlogList posts={posts} className="mt-4" />);
    expect(container.querySelector("ul")).toHaveClass("mt-4");
  });
});

describe("mockBlogPosts data", () => {
  it("is non-empty", () => {
    expect(mockBlogPosts.length).toBeGreaterThan(0);
  });

  it("has unique ids and slugs", () => {
    expect(new Set(mockBlogPosts.map((p) => p.id)).size).toBe(mockBlogPosts.length);
    expect(new Set(mockBlogPosts.map((p) => p.slug)).size).toBe(mockBlogPosts.length);
  });

  it("uses url-safe slugs", () => {
    for (const p of mockBlogPosts) expect(p.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it("every post has the fields BlogList renders", () => {
    for (const p of mockBlogPosts) {
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.thumbnailUrl.length).toBeGreaterThan(0);
      expect(Number.isNaN(new Date(p.publishedAt).getTime())).toBe(false);
    }
  });
});
