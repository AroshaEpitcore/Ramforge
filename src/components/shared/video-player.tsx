"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useRef } from "react";

export interface PlaybackSource {
  /** Direct media URL (provider resolves a signed, expiring URL at runtime). */
  src?: string;
  /** Poster/thumbnail shown before playback. */
  poster?: string;
  /** Provider that produced the source (informational). */
  provider?: string;
}

export interface VideoPlayerProps {
  source: PlaybackSource;
  title?: string;
  className?: string;
  /** Marks this as a free preview/trailer rather than the full asset. */
  isPreview?: boolean;
}

/**
 * Video player in a fixed 16:9 frame (the poster and the video occupy the exact
 * same box, so there is no size jump). Uses the browser's native controls —
 * single-click play, standard scrubber, volume, speed, fullscreen and PiP. HLS
 * (`.m3u8`) plays natively on Safari and via hls.js elsewhere; MP4 plays directly.
 *
 * With no `source.src` (e.g. a paid preview before purchase) it shows the poster.
 */
export function VideoPlayer({ source, title, className, isPreview }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !source.src) return;
    const src = source.src;
    const isHls = src.includes(".m3u8");

    if (!isHls || el.canPlayType("application/vnd.apple.mpegurl")) {
      el.src = src;
      return;
    }

    let destroy: (() => void) | undefined;
    let cancelled = false;
    void import("hls.js").then(({ default: Hls }) => {
      if (cancelled || !videoRef.current) return;
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(videoRef.current);
        destroy = () => hls.destroy();
      } else {
        videoRef.current.src = src;
      }
    });
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [source.src]);

  // Placeholder (no real source yet, e.g. a paid preview): poster.
  if (!source.src) {
    return (
      <div
        className={cn(
          "group relative aspect-video w-full overflow-hidden rounded-xl bg-black text-white",
          className,
        )}
      >
        {source.poster && (
          <Image
            src={source.poster}
            alt={title ?? "Video"}
            fill
            className="object-cover opacity-80"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
        {isPreview && (
          <div className="absolute top-3 left-3">
            <Badge variant="new">Preview</Badge>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("relative aspect-video w-full overflow-hidden rounded-xl bg-black", className)}
    >
      <video
        ref={videoRef}
        poster={source.poster}
        controls
        controlsList="nodownload"
        playsInline
        className="absolute inset-0 size-full object-contain"
      />
    </div>
  );
}
