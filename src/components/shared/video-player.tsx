"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
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
  /** Start playing as soon as the source is ready (e.g. after a click-to-play). */
  autoPlay?: boolean;
}

/**
 * Video player in a fixed 16:9 frame (the poster and the video occupy the exact
 * same box, so there is no size jump). Uses the browser's native controls —
 * single-click play, standard scrubber, volume, speed, fullscreen and PiP. HLS
 * (`.m3u8`) plays natively on Safari and via hls.js elsewhere; MP4 plays directly.
 *
 * With no `source.src` (e.g. a paid preview before purchase) it shows the poster.
 */
export function VideoPlayer({ source, title, className, isPreview, autoPlay }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !source.src) return;
    const src = source.src;
    const isHls = src.includes(".m3u8");
    const tryPlay = () => {
      if (autoPlay) void el.play().catch(() => {});
    };

    // Non-HLS (e.g. MP4) plays natively.
    if (!isHls) {
      el.src = src;
      tryPlay();
      return;
    }

    // HLS: prefer hls.js wherever it's supported (Chrome/Firefox/Edge). Only fall
    // back to the browser's native HLS when hls.js is unavailable (Safari/iOS).
    // NB: Chrome's canPlayType() can return a truthy "maybe" for HLS yet fail to
    // play it, so we must NOT gate on canPlayType before trying hls.js.
    let destroy: (() => void) | undefined;
    let cancelled = false;
    void import("hls.js").then(({ default: Hls }) => {
      const video = videoRef.current;
      if (cancelled || !video) return;
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, tryPlay);
        destroy = () => hls.destroy();
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        tryPlay();
      }
    });
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [source.src, autoPlay]);

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
        {/* Prominent play cue on the poster. */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="relative flex size-16 items-center justify-center">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/50" />
            <span className="relative flex size-16 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-xl ring-2 ring-white/40">
              <Play className="size-7 translate-x-0.5 fill-current" />
            </span>
          </span>
        </div>
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
        autoPlay={autoPlay}
        controlsList="nodownload"
        playsInline
        className="absolute inset-0 size-full object-contain"
      />
    </div>
  );
}
