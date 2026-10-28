"use client";

import { FilterBar } from "@/components/shared/filter-bar";
import { VideoGrid } from "@/components/shared/video-grid";
import { Button } from "@/components/ui/button";
import { PAGE_SIZE } from "@/config/constants";
import { useShopFilters } from "@/hooks/use-shop-filters";
import type { Video } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

const effPrice = (v: Video) => v.salePrice ?? v.price;

/** Client shop grid. Filters/sorts/paginates the full published list in memory,
 * driven by the URL state (nuqs) so links stay shareable. */
export function ShopView({ videos }: { videos: Video[] }) {
  const [filters, setFilters] = useShopFilters();

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    let list = videos.filter((v) => {
      if (
        q &&
        !v.title.toLowerCase().includes(q) &&
        !v.tags.some((t) => t.toLowerCase().includes(q))
      )
        return false;
      if (filters.category && v.category.slug !== filters.category) return false;
      if (filters.quality.length && !filters.quality.includes(v.quality)) return false;
      if (filters.minPrice != null && effPrice(v) < filters.minPrice) return false;
      if (filters.maxPrice != null && effPrice(v) > filters.maxPrice) return false;
      return true;
    });

    const by: Record<string, (a: Video, b: Video) => number> = {
      newest: (a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
      price_asc: (a, b) => effPrice(a) - effPrice(b),
      price_desc: (a, b) => effPrice(b) - effPrice(a),
      duration_asc: (a, b) => a.durationSec - b.durationSec,
      duration_desc: (a, b) => b.durationSec - a.durationSec,
      rating: (a, b) => b.rating - a.rating,
      popular: (a, b) => b.viewCount - a.viewCount,
    };
    list = [...list].sort(by[filters.sort] ?? by.newest);
    return list;
  }, [videos, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page), totalPages);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">All videos</h1>
        <p className="text-sm text-muted-foreground">
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      <FilterBar />

      <VideoGrid
        videos={pageItems}
        columns={3}
        emptyTitle="No videos match your filters"
        emptyDescription="Try clearing search or filters."
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setFilters({ page: page - 1 })}
            leftIcon={<ChevronLeft />}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setFilters({ page: page + 1 })}
            rightIcon={<ChevronRight />}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
