import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/shared/json-ld";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { CoursePlayer } from "@/features/courses/components/course-player";
import { buildMetadata } from "@/lib/seo";
import { ownsCourse } from "@/server/queries/account";
import { getCourseBySlug } from "@/server/queries/courses";
import { getCurrentUser } from "@/server/current-user";
import { isPaymentsEnabled } from "@/server/services/settings";
import type { CourseDetail } from "@/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return buildMetadata({ title: "Course not found" });
  return buildMetadata({ title: course.title, description: course.description });
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [course, paymentsEnabled, user] = await Promise.all([
    getCourseBySlug(slug),
    isPaymentsEnabled(),
    getCurrentUser(),
  ]);
  if (!course) notFound();

  const owned = user ? await ownsCourse(user.id, course.id) : false;

  return (
    <Container className="pt-3 pb-10">
      <JsonLd data={courseJsonLd(course)} />
      {/* Player sits directly under the navbar (no heading above it). The course
          title and description move below, like a Udemy-style course viewer. */}
      <CoursePlayer course={course} paymentsEnabled={paymentsEnabled} owned={owned} />
      <div className="mt-8 max-w-3xl space-y-2">
        {course.category && <Badge variant="secondary">{course.category.name}</Badge>}
        <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
        <p className="text-muted-foreground">{course.description}</p>
      </div>
    </Container>
  );
}

/** schema.org Course + VideoObject for free YouTube lessons (SEO rich results). */
function courseJsonLd(course: CourseDetail): Record<string, unknown> {
  const base = siteConfig.url.replace(/\/$/, "");
  const freeVideos = course.lessons
    .filter((l) => l.free && l.source === "YOUTUBE" && l.youtubeId)
    .map((l) => ({
      "@type": "VideoObject",
      name: l.title,
      description: course.title,
      embedUrl: `https://www.youtube.com/embed/${l.youtubeId}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${l.youtubeId}/hqdefault.jpg`,
      uploadDate: undefined,
    }));

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    url: `${base}/courses/${course.slug}`,
    provider: { "@type": "Organization", name: siteConfig.name, url: base },
    ...(freeVideos.length ? { hasPart: freeVideos } : {}),
  };
}
