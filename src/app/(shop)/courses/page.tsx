import { Container } from "@/components/layout/container";
import { CourseCard } from "@/components/shared/course-card";
import { EmptyState } from "@/components/ui/empty-state";
import { buildMetadata } from "@/lib/seo";
import { listPublishedCourses } from "@/server/queries/courses";
import { isPaymentsEnabled } from "@/server/services/settings";
import { GraduationCap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Courses",
  description: "Structured video courses — watch the free lessons, unlock the rest.",
});

export default async function CoursesPage() {
  const [courses, paymentsEnabled] = await Promise.all([
    listPublishedCourses(),
    isPaymentsEnabled(),
  ]);

  return (
    <Container className="py-8">
      <div className="mb-6 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Courses</h1>
        <p className="text-muted-foreground">
          Follow a course lesson by lesson. Free lessons play for everyone.
        </p>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={<GraduationCap />}
          title="No courses yet"
          description="New courses are on the way — check back soon."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} paymentsEnabled={paymentsEnabled} />
          ))}
        </div>
      )}
    </Container>
  );
}
