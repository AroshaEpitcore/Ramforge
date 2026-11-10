import { PageHeader } from "@/components/layout/page-header";
import { BlogManager } from "@/features/admin/components/blog-manager";
import { requirePermission } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";
import { listBlogPostsForAdmin } from "@/server/queries/blog";
import { getCurrentUser } from "@/server/current-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({ title: "Blog" });

export default async function AdminBlogPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/blog");
  requirePermission(user, "blog:manage");

  const posts = await listBlogPostsForAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog"
        description="Write, schedule and publish articles. Published posts appear on the public blog."
      />
      <BlogManager posts={posts} />
    </div>
  );
}
