"use client";

import "video.js/dist/video-js.css";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

/** Minimal surface of the Video.js player we use (its shipped types are stubs). */
interface VjsPlayer {
  isDisposed(): boolean;
  dispose(): void;
  src(source: { src: string; type?: string }): void;
}

/**
 * Industry-standard player (Video.js). Native-feeling control bar with scrubber,
 * volume, playback speed, picture-in-picture and fullscreen; responsive 16:9.
 * Plays MP4 directly and HLS via Video.js's built-in HTTP streaming.
 *
 * Video.js is imported **dynamically on the client only** (it is not SSR-safe),
 * the player owns a `<video>` created imperatively (the recommended React
 * pattern), and init is guarded so a failure degrades to native controls rather
 * than crashing the page.
 */
export function VideoJsPlayer({
  src,
  type,
  poster,
  className,
}: {
  src: string;
  type?: string;
  poster?: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<VjsPlayer | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || playerRef.current) return;
    let disposed = false;

    // Create the media element imperatively so Video.js — not React — owns it.
    const videoEl = document.createElement("video");
    videoEl.classList.add("video-js", "vjs-big-play-centered", "vjs-fluid");
    videoEl.setAttribute("playsinline", "");
    videoEl.setAttribute("controls", ""); // native fallback if Video.js fails
    if (poster) videoEl.setAttribute("poster", poster);
    container.appendChild(videoEl);

    void import("video.js")
      .then((mod) => {
        const videojs = ((mod as { default?: unknown }).default ?? mod) as unknown;
        if (disposed || typeof videojs !== "function") {
          if (src) videoEl.src = src;
          return;
        }
        try {
          const create = videojs as (el: HTMLElement, opts: Record<string, unknown>) => VjsPlayer;
          playerRef.current = create(videoEl, {
            controls: true,
            responsive: true,
            fluid: true,
            preload: "metadata",
            poster,
            playbackRates: [0.5, 1, 1.25, 1.5, 2],
            sources: src ? [{ src, type: type ?? "video/mp4" }] : [],
          });
        } catch {
          if (src) videoEl.src = src; // graceful fallback to native controls
        }
      })
      .catch(() => {
        if (src) videoEl.src = src;
      });

    return () => {
      disposed = true;
      const player = playerRef.current;
      try {
        if (player && !player.isDisposed()) player.dispose();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap the source if it changes (e.g. a freshly-signed URL).
  useEffect(() => {
    const player = playerRef.current;
    if (player && src) {
      try {
        player.src({ src, type: type ?? "video/mp4" });
      } catch {
        /* ignore */
      }
    }
  }, [src, type]);

  return (
    <div className={cn("overflow-hidden rounded-xl bg-black", className)} data-vjs-player>
      <div ref={containerRef} className="aspect-video w-full" />
    </div>
  );
}
