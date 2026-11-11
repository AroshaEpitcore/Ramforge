import "server-only";

import { isPublished } from "@/lib/publishing";
import { db } from "@/server/db";
import type { CourseDetail, CourseSectionGroup, CourseSummary, Lesson, VideoSource } from "@/types";

/** Prisma `where` fragment: publicly visible (published + schedule passed). */
function publishedWhere(now = new Date()) {
  return {
    status: "PUBLISHED" as const,
    OR: [{ publishAt: null }, { publishAt: { lte: now } }],
  };
}

type LessonRow = {
  id: string;
  title: string;
  slug: string;
  position: number;
  durationSec: number;
  accessMode: "FREE" | "PAID" | "MEMBERS";
  source: VideoSource;
  youtubeId: string | null;
  notes: string | null;
  sectionId: string | null;
};

function toLesson(v: LessonRow): Lesson {
  return {
    id: v.id,
    title: v.title,
    slug: v.slug,
    position: v.position,
    durationSec: v.durationSec,
    accessMode: v.accessMode,
    free: v.accessMode === "FREE",
    source: v.source,
    youtubeId: v.youtubeId,
    notes: v.notes,
    sectionId: v.sectionId,
  };
}

/**
 * Group ordered lessons into their sections (ordered by the section's own
 * position). Lessons without a section fall into a trailing "ungrouped" bucket.
 * Empty sections are omitted; the ungrouped bucket only appears if it has
 * lessons AND at least one real section exists (otherwise callers use the flat
 * list).
 */
function groupLessonsBySection(
  lessons: Lesson[],
  sections: { id: string; title: string }[],
): CourseSectionGroup[] {
  const groups: CourseSectionGroup[] = [];
  for (const s of sections) {
    const inSection = lessons.filter((l) => l.sectionId === s.id);
    if (inSection.length > 0) groups.push({ id: s.id, title: s.title, lessons: inSection });
  }
  const ungrouped = lessons.filter((l) => !l.sectionId);
  if (ungrouped.length > 0) {
    groups.push({ id: null, title: groups.length > 0 ? "More lessons" : null, lessons: ungrouped });
  }
  return groups;
}

/** Published courses for the storefront listing. */
export async function listPublishedCourses(): Promise<CourseSummary[]> {
  const now = new Date();
  const courses = await db.course.findMany({
    where: publishedWhere(now),
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      lessons: { where: publishedWhere(now), select: { accessMode: true } },
    },
  });

  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    thumbnailUrl: c.thumbnailUrl,
    category: c.category,
    price: c.price,
    salePrice: c.salePrice,
    lessonCount: c.lessons.length,
    freeLessonCount: c.lessons.filter((l) => l.accessMode === "FREE").length,
  }));
}

/** A single published course with its ordered, published lessons. */
export async function getCourseBySlug(slug: string): Promise<CourseDetail | null> {
  const now = new Date();
  const course = await db.course.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      sections: { orderBy: { position: "asc" }, select: { id: true, title: true } },
      lessons: {
        where: publishedWhere(now),
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          slug: true,
          position: true,
          durationSec: true,
          accessMode: true,
          source: true,
          youtubeId: true,
          notes: true,
          sectionId: true,
        },
      },
    },
  });

  if (!course || !isPublished(course, now)) return null;

  const lessons = course.lessons.map(toLesson);
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    thumbnailUrl: course.thumbnailUrl,
    category: course.category,
    price: course.price,
    salePrice: course.salePrice,
    lessonCount: lessons.length,
    freeLessonCount: lessons.filter((l) => l.free).length,
    lessons,
    sections: groupLessonsBySection(lessons, course.sections),
  };
}

/** All published course slugs (for sitemap / static params). */
export async function listPublishedCourseSlugs(): Promise<string[]> {
  const rows = await db.course.findMany({
    where: publishedWhere(),
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}
