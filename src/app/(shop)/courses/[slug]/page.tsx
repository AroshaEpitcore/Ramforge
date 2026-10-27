import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/shared/json-ld";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { CoursePlayer } from "@/features/courses/components/course-player";
import { buildMetadata } from "@/lib/seo";
import { getCourseBySlug } from "@/server/queries/courses";
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
  const [course, paymentsEnabled] = await Promise.all([getCourseBySlug(slug), isPaymentsEnabled()]);
  if (!course) notFound();

  return (
    <Container className="py-8">
      <JsonLd data={courseJsonLd(course)} />
      <div className="mb-6 space-y-2">
        {course.category && <Badge variant="secondary">{course.category.name}</Badge>}
        <h1 className="text-3xl font-semibold tracking-tight">{course.title}</h1>
        <p className="max-w-3xl text-muted-foreground">{course.description}</p>
      </div>
      <CoursePlayer course={course} paymentsEnabled={paymentsEnabled} />
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
