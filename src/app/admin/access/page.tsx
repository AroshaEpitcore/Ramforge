import { PageHeader } from "@/components/layout/page-header";
import { AccessManager } from "@/features/admin/components/access-manager";
import { requirePermission } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";
import { listCourseOptions, listVideoOptions } from "@/server/queries/admin";
import { listAccessGrants } from "@/server/queries/admin-ops";
import { getCurrentUser } from "@/server/current-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Access grants" });

export default async function AdminAccessPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/access");
  requirePermission(user, "access:read");

  const [grants, courses, videos] = await Promise.all([
    listAccessGrants(),
    listCourseOptions(),
    listVideoOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Access grants"
        description="Grant or revoke access to courses and videos."
      />
      <AccessManager grants={grants} courses={courses} videos={videos} />
    </div>
  );
}
