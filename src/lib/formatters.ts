import { siteConfig } from "@/config/site";
import { format, formatDistanceToNowStrict } from "date-fns";

/**
 * Format an amount stored in integer **minor units** (e.g. cents) as currency.
 * All money in the app is stored as minor units — never floats.
 */
export function formatCurrency(
  minorUnits: number,
  currency: string = siteConfig.currency,
  locale: string = siteConfig.locale,
): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(minorUnits / 100);
}

/** Split a formatted price into parts for custom rendering (symbol vs amount). */
export function formatCurrencyParts(
  minorUnits: number,
  currency: string = siteConfig.currency,
  locale: string = siteConfig.locale,
) {
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).formatToParts(minorUnits / 100);
  const symbol = parts.find((p) => p.type === "currency")?.value ?? "";
  const amount = parts
    .filter((p) => p.type !== "currency")
    .map((p) => p.value)
    .join("")
    .trim();
  return { symbol, amount };
}

/** Percentage discount between an original and sale price (rounded). */
export function discountPercent(price: number, salePrice: number): number {
  if (price <= 0 || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

/**
 * Format a duration in seconds.
 * - "clock": 75 → "1:15", 3725 → "1:02:05"
 * - "long":  75 → "1m 15s", 3725 → "1h 2m"
 */
export function formatDuration(totalSeconds: number, style: "clock" | "long" = "clock"): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (style === "long") {
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Human-readable file size, e.g. 15_728_640 → "15 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

/** Compact number, e.g. 12_400 → "12.4K". */
export function formatCompactNumber(value: number, locale: string = siteConfig.locale): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

/** Absolute date, e.g. "Oct 16, 2026". */
export function formatDate(date: Date | string | number, pattern = "MMM d, yyyy"): string {
  return format(new Date(date), pattern);
}

/** Relative date, e.g. "3 days ago". */
export function formatRelativeDate(date: Date | string | number): string {
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
}
