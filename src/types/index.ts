/**
 * App-level domain types. These are UI/view models kept intentionally
 * independent of the Prisma client so mock data and components don't depend on
 * a generated DB client. The Prisma schema mirrors these enums/shapes.
 */

export type Role =
  "SUPER_ADMIN" | "STORE_MANAGER" | "CONTENT_UPLOADER" | "SUPPORT_STAFF" | "CUSTOMER";

/** Who is allowed to watch the full video. */
export type AccessMode = "FREE" | "PAID" | "MEMBERS";

/** How a buyer may consume a video they have access to. */
export type EntitlementType = "STREAM" | "DOWNLOAD" | "RENTAL";

export type VideoQuality = "SD" | "HD" | "UHD_4K";

export type VideoStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type OrderStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string | null;
  children?: Category[];
  videoCount?: number;
}

export interface Review {
  id: string;
  videoId: string;
  author: { name: string; avatarUrl?: string };
  rating: number;
  title?: string;
  body: string;
  createdAt: string;
  verifiedPurchase?: boolean;
}

/** Buy option offered on a video, mapping to an EntitlementType. */
export interface PurchaseOption {
  type: EntitlementType;
  /** Price in integer minor units. */
  price: number;
  salePrice?: number | null;
  /** For RENTAL only: access window length in days. */
  rentalDays?: number;
  label?: string;
}

export interface Video {
  id: string;
  title: string;
  slug: string;
  description: string;
  tags: string[];
  category: Pick<Category, "id" | "name" | "slug">;
  thumbnailUrl: string;
  /** Free-to-watch preview/trailer asset id (provider-agnostic). */
  previewAssetId?: string;
  /** Full video asset id, buyers only. */
  fullAssetId?: string;
  durationSec: number;
  quality: VideoQuality;
  fileSizeBytes?: number;
  /** Base price in minor units. */
  price: number;
  salePrice?: number | null;
  accessMode: AccessMode;
  allowDownload: boolean;
  /** Default rental window in days when rentable. */
  rentalDays?: number | null;
  status: VideoStatus;
  purchaseOptions: PurchaseOption[];
  rating: number;
  reviewCount: number;
  viewCount: number;
  publishedAt?: string;
  isNew?: boolean;
}

/** Where a video streams from. */
export type VideoSource = "MUX" | "YOUTUBE";

/** A single lesson within a course (a Video with a position). */
export interface Lesson {
  id: string;
  title: string;
  slug: string;
  position: number;
  durationSec: number;
  accessMode: AccessMode;
  /** True when this lesson is free to watch by anyone. */
  free: boolean;
  source: VideoSource;
  youtubeId?: string | null;
  notes?: string | null;
}

/** Course card/listing view model. */
export interface CourseSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string | null;
  category?: Pick<Category, "id" | "name" | "slug"> | null;
  /** Prices in minor units. */
  price: number;
  salePrice?: number | null;
  lessonCount: number;
  freeLessonCount: number;
}

/** Course detail view model with ordered lessons. */
export interface CourseDetail extends CourseSummary {
  lessons: Lesson[];
}

export interface Bundle {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  videoIds: string[];
  videoCount: number;
  /** Bundle price in minor units (typically < sum of parts). */
  price: number;
  salePrice?: number | null;
  /** Combined value of included videos, for "save X%" display. */
  valuePrice: number;
}

/** A line in the cart — a video (with a chosen option) or a bundle. */
export interface CartLine {
  id: string;
  kind: "video" | "bundle";
  refId: string;
  title: string;
  thumbnailUrl: string;
  option?: EntitlementType;
  rentalDays?: number;
  unitPrice: number;
  quantity: number;
}

/** An owned/rented item shown in My Library. */
export interface LibraryEntry {
  id: string;
  video: Pick<Video, "id" | "title" | "slug" | "thumbnailUrl" | "durationSec" | "quality">;
  accessType: EntitlementType;
  grantedAt: string;
  /** For RENTAL: when access expires. */
  expiresAt?: string | null;
  downloadCount?: number;
  downloadLimit?: number;
  watchedSec?: number;
  revokedAt?: string | null;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  imageUrl: string;
  ctaLabel?: string;
  ctaHref?: string;
  active: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  thumbnailUrl: string;
  publishedAt: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
}

/** Discriminated result type returned by server actions. */
export type ActionResult<T = void> =
  { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
