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
} as const;

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
