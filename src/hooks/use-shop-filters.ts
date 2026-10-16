"use client";

import { SORT_OPTIONS, type SortOption } from "@/config/constants";
import type { VideoQuality } from "@/types";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

const sortValues = SORT_OPTIONS.map((o) => o.value) as unknown as SortOption[];
const qualityValues: VideoQuality[] = ["SD", "HD", "UHD_4K"];

/**
 * URL-synced shop/search/filter state (nuqs). The URL is the source of truth so
 * filters are shareable and survive refresh/back-forward.
 */
export function useShopFilters() {
  return useQueryStates(
    {
      q: parseAsString.withDefault(""),
      category: parseAsString.withDefault(""),
      sort: parseAsStringLiteral(sortValues).withDefault("newest"),
      quality: parseAsArrayOf(parseAsStringLiteral(qualityValues)).withDefault([]),
      minPrice: parseAsInteger,
      maxPrice: parseAsInteger,
      page: parseAsInteger.withDefault(1),
    },
    { history: "push", shallow: true, clearOnDefault: true },
  );
}
