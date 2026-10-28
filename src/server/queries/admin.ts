import "server-only";

import { db } from "@/server/db";

/** Row shapes returned to the admin UI (plain & serializable — no BigInt). */
export interface AdminCategoryRow {
  id: string;
  name: string;
  slug: string;
  parentName: string | null;
  videoCount: number;
  courseCount: number;
}
export interface AdminCourseRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  categoryId: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  categoryName: string | null;
  lessonCount: number;
  price: number;
  publishAt: string | null;
}
export interface AdminVideoRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  accessMode: "FREE" | "PAID" | "MEMBERS";
  source: "MUX" | "YOUTUBE";
  categoryId: string;
  categoryName: string | null;
  courseId: string | null;
  courseTitle: string | null;
  youtubeId: string | null;
  fullAssetId: string | null;
  notes: string | null;
  publishAt: string | null;
  position: number;
  price: number;
}

export async function listCategoriesForAdmin(): Promise<AdminCategoryRow[]> {
  const rows = await db.category.findMany({
    orderBy: { name: "asc" },
    include: {
      parent: { select: { name: true } },
      _count: { select: { videos: true, courses: true } },
    },
  });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentName: c.parent?.name ?? null,
    videoCount: c._count.videos,
    courseCount: c._count.courses,
  }));
}

export async function listCoursesForAdmin(): Promise<AdminCourseRow[]> {
  const rows = await db.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      _count: { select: { lessons: true } },
    },
  });
  return rows.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    categoryId: c.categoryId,
    status: c.status,
    categoryName: c.category?.name ?? null,
    lessonCount: c._count.lessons,
    price: c.price,
    publishAt: c.publishAt ? c.publishAt.toISOString() : null,
  }));
}

export async function listVideosForAdmin(): Promise<AdminVideoRow[]> {
  const rows = await db.video.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      course: { select: { title: true } },
    },
  });
  return rows.map((v) => ({
    id: v.id,
    title: v.title,
    slug: v.slug,
    description: v.description,
    status: v.status,
    accessMode: v.accessMode,
    source: v.source,
    categoryId: v.categoryId,
    categoryName: v.category?.name ?? null,
    courseId: v.courseId,
    courseTitle: v.course?.title ?? null,
    youtubeId: v.youtubeId,
    fullAssetId: v.fullAssetId,
    notes: v.notes,
    publishAt: v.publishAt ? v.publishAt.toISOString() : null,
    position: v.position,
    price: v.price,
  }));
}

/** Lightweight option lists for form selects. */
export async function listCategoryOptions(): Promise<{ id: string; name: string }[]> {
  return db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
}
export async function listCourseOptions(): Promise<{ id: string; title: string }[]> {
  return db.course.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } });
}
export async function listVideoOptions(): Promise<{ id: string; title: string }[]> {
  return db.video.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } });
}

/** Ordered lessons of a course, for the reorder UI. */
export async function getCourseLessons(
  courseId: string,
): Promise<{ id: string; title: string; position: number; accessMode: string }[]> {
  return db.video.findMany({
    where: { courseId },
    orderBy: { position: "asc" },
    select: { id: true, title: true, position: true, accessMode: true },
  });
}

/** Single records for edit forms (serialisable projections). */
export async function getCategoryForEdit(id: string) {
  return db.category.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, description: true, parentId: true },
  });
}
export async function getCourseForEdit(id: string) {
  const c = await db.course.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      categoryId: true,
      price: true,
      status: true,
      publishAt: true,
    },
  });
  return c ? { ...c, publishAt: c.publishAt ? c.publishAt.toISOString() : null } : null;
}
export async function getVideoForEdit(id: string) {
  const v = await db.video.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      categoryId: true,
      courseId: true,
      position: true,
      source: true,
      youtubeId: true,
      accessMode: true,
      price: true,
      status: true,
      publishAt: true,
      notes: true,
    },
  });
  return v ? { ...v, publishAt: v.publishAt ? v.publishAt.toISOString() : null } : null;
}
