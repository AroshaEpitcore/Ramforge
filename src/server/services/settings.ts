import "server-only";

import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma";

/**
 * Key/value site settings backed by the `Setting` table (JSON values).
 * Used for runtime toggles that must change without a code deploy — notably the
 * `payments.enabled` switch that gates all pricing UI at launch.
 */
export const SETTING_KEYS = {
  paymentsEnabled: "payments.enabled",
  vatRatePercent: "tax.vatRatePercent",
  donateImageUrl: "donate.imageUrl",
  videoBanner: "video.banner",
  snowEnabled: "effects.snow",
} as const;

export interface VideoBanner {
  imageUrl: string;
  href: string;
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.setting.findUnique({ where: { key } });
  if (!row) return fallback;
  return row.value as T;
}

export async function setSetting(key: string, value: Prisma.InputJsonValue): Promise<void> {
  await db.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

/** Whether paid courses/videos are currently sellable. Off by default. */
export async function isPaymentsEnabled(): Promise<boolean> {
  return getSetting<boolean>(SETTING_KEYS.paymentsEnabled, false);
}

/** Whether the festive snow effect shows on the storefront. On by default. */
export async function isSnowEnabled(): Promise<boolean> {
  return getSetting<boolean>(SETTING_KEYS.snowEnabled, true);
}

/** Flat VAT/sales-tax rate as a percentage (0 = no tax). */
export async function getVatRatePercent(): Promise<number> {
  const v = await getSetting<number>(SETTING_KEYS.vatRatePercent, 0);
  return typeof v === "number" && v > 0 ? Math.min(100, v) : 0;
}

/** Admin-set donate card image URL, or null to use the bundled default. */
export async function getDonateImageUrl(): Promise<string | null> {
  const v = await getSetting<string | null>(SETTING_KEYS.donateImageUrl, null);
  return typeof v === "string" && v.length > 0 ? v : null;
}

/** Admin-set promo banner shown in the video-page sidebar, or null if unset. */
export async function getVideoBanner(): Promise<VideoBanner | null> {
  const v = await getSetting<VideoBanner | null>(SETTING_KEYS.videoBanner, null);
  if (v && typeof v.imageUrl === "string" && v.imageUrl.length > 0) {
    return { imageUrl: v.imageUrl, href: typeof v.href === "string" ? v.href : "" };
  }
  return null;
}
