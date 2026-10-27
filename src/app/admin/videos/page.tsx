import { PageHeader } from "@/components/layout/page-header";
import { VideoManager } from "@/features/admin/components/video-manager";
import { requirePermission } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";
import { listCategoryOptions, listCourseOptions, listVideosForAdmin } from "@/server/queries/admin";
import { getCurrentUser } from "@/server/current-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Videos" });

export default async function AdminVideosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/videos");
  requirePermission(user, "videos:read");

  const [videos, categories, courses] = await Promise.all([
    listVideosForAdmin(),
    listCategoryOptions(),
    listCourseOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Videos"
        description="Create and publish videos. Free videos embed from YouTube; paid lessons stream from Mux."
      />
      <VideoManager videos={videos} categories={categories} courses={courses} />
    </div>
  );
}
