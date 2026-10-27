/**
 * Visibility rule for catalogue items (videos & courses), shared by queries and
 * UI. An item is publicly visible when it is PUBLISHED and either has no
 * scheduled publish time or that time has passed. Pure & client-safe — no cron
 * job needed; scheduled publishing is just a query-time date check.
 */
export type PublishStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface Publishable {
  status: PublishStatus;
  publishAt?: Date | string | null;
}

export function isPublished(item: Publishable, now: Date = new Date()): boolean {
  if (item.status !== "PUBLISHED") return false;
  if (!item.publishAt) return true;
  return new Date(item.publishAt).getTime() <= now.getTime();
}
