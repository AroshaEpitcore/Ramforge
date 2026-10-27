import type { AccessMode, EntitlementType, OrderStatus, VideoQuality } from "@/types";

/** Minimum password length — enforced by both client forms and server actions. */
export const MIN_PASSWORD_LENGTH = 8;

/** Default max downloads granted per purchased video (admin-overridable). */
export const DEFAULT_DOWNLOAD_LIMIT = 3;

/** Default rental window in days when a video is offered for rent. */
export const DEFAULT_RENTAL_DAYS = 7;

/** Max simultaneous playback sessions per account (anti-sharing). */
export const CONCURRENT_DEVICE_LIMIT = 2;

/** Signed playback URL lifetime, in seconds. */
export const PLAYBACK_URL_TTL_SECONDS = 60 * 60; // 1 hour

/** Maximum accepted source video upload size (bytes). Mirrored in the dropzone label. */
export const MAX_VIDEO_UPLOAD_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB

/** Accepted source video MIME type prefixes for uploads. */
export const ACCEPTED_VIDEO_MIME_PREFIX = "video/";

export const PAGE_SIZE = 12;
export const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

export const QUALITY_LABELS: Record<VideoQuality, string> = {
  SD: "SD",
  HD: "HD",
  UHD_4K: "4K",
};

export const ACCESS_MODE_LABELS: Record<AccessMode, string> = {
  FREE: "Free",
  PAID: "Buyers only",
  MEMBERS: "Members",
};

export const ENTITLEMENT_LABELS: Record<EntitlementType, string> = {
  STREAM: "Stream",
  DOWNLOAD: "Download",
  RENTAL: "Rent",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially refunded",
};

/** Sort options for the shop/search (kept in sync with nuqs filter state). */
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "duration_asc", label: "Shortest" },
  { value: "duration_desc", label: "Longest" },
  { value: "rating", label: "Top rated" },
  { value: "popular", label: "Most popular" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];
