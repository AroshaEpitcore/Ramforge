"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QUALITY_LABELS, SORT_OPTIONS } from "@/config/constants";
import { useShopFilters } from "@/hooks/use-shop-filters";
import { cn } from "@/lib/utils";
import type { VideoQuality } from "@/types";
import { SlidersHorizontal, X } from "lucide-react";

const QUALITIES: VideoQuality[] = ["HD", "UHD_4K"];

export function FilterBar({ className }: { className?: string }) {
  const [filters, setFilters] = useShopFilters();

  const activeCount =
    (filters.category ? 1 : 0) + filters.quality.length + (filters.q ? 1 : 0);

  const toggleQuality = (q: VideoQuality) => {
    const next = filters.quality.includes(q)
      ? filters.quality.filter((x) => x !== q)
      : [...filters.quality, q];
    void setFilters({ quality: next, page: 1 });
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Select
        value={filters.sort}
        onValueChange={(value) => setFilters({ sort: value as typeof filters.sort, page: 1 })}
      >
        <SelectTrigger size="sm" className="w-44">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" leftIcon={<SlidersHorizontal />}>
            Quality
            {filters.quality.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {filters.quality.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-48">
          <p className="mb-2 text-sm font-medium">Quality</p>
          <div className="flex flex-col gap-2">
            {QUALITIES.map((q) => (
              <Label key={q} className="font-normal">
                <Checkbox
                  checked={filters.quality.includes(q)}
                  onCheckedChange={() => toggleQuality(q)}
                />
                {QUALITY_LABELS[q]}
              </Label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setFilters({ category: "", quality: [], q: "", minPrice: null, maxPrice: null, page: 1 })
          }
          rightIcon={<X />}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
