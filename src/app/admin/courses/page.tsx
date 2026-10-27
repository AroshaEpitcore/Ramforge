import { PageHeader } from "@/components/layout/page-header";
import { CourseManager } from "@/features/admin/components/course-manager";
import { requirePermission } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";
import { listCategoryOptions, listCoursesForAdmin } from "@/server/queries/admin";
import { getCurrentUser } from "@/server/current-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Courses" });

export default async function AdminCoursesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/courses");
  requirePermission(user, "videos:read");

  const [courses, categories] = await Promise.all([listCoursesForAdmin(), listCategoryOptions()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Group videos into ordered courses. Assign lessons from the video editor (set a course + position)."
      />
      <CourseManager courses={courses} categories={categories} />
    </div>
  );
}
