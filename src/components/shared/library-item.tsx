"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ENTITLEMENT_LABELS, QUALITY_LABELS } from "@/config/constants";
import { formatRelativeDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { LibraryEntry } from "@/types";
import { Download, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function LibraryItem({ entry, className }: { entry: LibraryEntry; className?: string }) {
  const { video } = entry;
  const watchedPct = entry.watchedSec
    ? Math.min(100, Math.round((entry.watchedSec / video.durationSec) * 100))
    : 0;
  const expired = entry.expiresAt ? new Date(entry.expiresAt) < new Date() : false;
  const revoked = Boolean(entry.revokedAt);
  const unavailable = expired || revoked;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center",
        className,
      )}
    >
      <Link
        href={`/watch/${video.slug}`}
        className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg sm:w-44"
      >
        <Image src={video.thumbnailUrl} alt={video.title} fill sizes="176px" className="object-cover" />
        {watchedPct > 0 && (
          <div className="absolute inset-x-0 bottom-0">
            <Progress value={watchedPct} className="h-1 rounded-none" />
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={entry.accessType === "RENTAL" ? "rented" : "owned"}>
            {entry.accessType === "RENTAL" ? "Rented" : ENTITLEMENT_LABELS[entry.accessType]}
          </Badge>
          <Badge variant={video.quality === "UHD_4K" ? "4k" : "outline"}>
            {QUALITY_LABELS[video.quality]}
          </Badge>
          {entry.accessType === "RENTAL" && entry.expiresAt && (
            <span className={cn("text-xs", expired ? "text-destructive" : "text-muted-foreground")}>
              {expired ? "Expired" : `Expires ${formatRelativeDate(entry.expiresAt)}`}
            </span>
          )}
          {revoked && <span className="text-xs text-destructive">Access revoked</span>}
        </div>

        <h3 className="truncate font-medium">{video.title}</h3>
        <p className="text-xs text-muted-foreground">
          Added {formatRelativeDate(entry.grantedAt)}
          {typeof entry.downloadLimit === "number" &&
            ` · ${entry.downloadCount ?? 0}/${entry.downloadLimit} downloads used`}
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        <Button asChild size="sm" disabled={unavailable} leftIcon={<Play className="fill-current" />}>
          <Link href={`/watch/${video.slug}`}>Watch</Link>
        </Button>
        {typeof entry.downloadLimit === "number" && (
          <Button
            variant="outline"
            size="sm"
            disabled={unavailable || (entry.downloadCount ?? 0) >= entry.downloadLimit}
            leftIcon={<Download />}
          >
            Download
          </Button>
        )}
      </div>
    </div>
  );
}
