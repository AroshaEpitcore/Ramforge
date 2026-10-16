import { Badge } from "@/components/ui/badge";
import { Duration } from "@/components/ui/duration";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { QUALITY_LABELS } from "@/config/constants";
import { formatCompactNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Video } from "@/types";
import { Eye, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export interface VideoCardProps {
  video: Video;
  /** "default" = full card with price; "compact" = smaller, for dense grids. */
  variant?: "default" | "compact";
  className?: string;
  priority?: boolean;
}

/**
 * Storefront video card with a hover preview animation (thumbnail zoom + play
 * overlay). Pure CSS hover, so it renders as a Server Component.
 */
export function VideoCard({ video, variant = "default", className, priority }: VideoCardProps) {
  const compact = variant === "compact";
  const onSale = typeof video.salePrice === "number" && video.salePrice < video.price;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20",
        className,
      )}
    >
      <Link href={`/video/${video.slug}`} className="relative block aspect-video overflow-hidden">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg">
            <Play className="size-5 translate-x-0.5 fill-current" />
          </span>
        </div>

        {/* Top-left badges */}
        <div className="absolute left-2 top-2 flex gap-1">
          {video.accessMode === "FREE" && <Badge variant="success">Free</Badge>}
          {onSale && <Badge variant="sale">Sale</Badge>}
          {video.isNew && <Badge variant="new">New</Badge>}
        </div>
        {/* Top-right quality */}
        <div className="absolute right-2 top-2">
          <Badge variant={video.quality === "UHD_4K" ? "4k" : "hd"}>
            {QUALITY_LABELS[video.quality]}
          </Badge>
        </div>
        {/* Duration */}
        <div className="absolute bottom-2 right-2">
          <span className="rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white tabular-nums">
            <Duration seconds={video.durationSec} />
          </span>
        </div>
      </Link>

      <div className={cn("flex flex-1 flex-col gap-2", compact ? "p-3" : "p-4")}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href={`/shop?category=${video.category.slug}`}
            className="font-medium text-primary transition-colors hover:text-primary/80"
          >
            {video.category.name}
          </Link>
        </div>

        <h3 className={cn("font-semibold leading-snug", compact ? "text-sm" : "text-base")}>
          <Link href={`/video/${video.slug}`} className="line-clamp-2 outline-none after:absolute">
            {video.title}
          </Link>
        </h3>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Rating value={video.rating} size="sm" />
          <span>{video.rating.toFixed(1)}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" />
            {formatCompactNumber(video.viewCount)}
          </span>
        </div>

        {!compact && (
          <div className="mt-auto pt-2">
            <Price
              price={video.price}
              salePrice={video.salePrice}
              size="md"
              showDiscountBadge
            />
          </div>
        )}
      </div>
    </article>
  );
}
