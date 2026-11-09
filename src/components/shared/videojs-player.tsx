"use client";

import "video.js/dist/video-js.css";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import videojs from "video.js";

/** Minimal surface of the Video.js player we use (its shipped types are stubs). */
interface VjsPlayer {
  isDisposed(): boolean;
  dispose(): void;
  src(source: { src: string; type?: string }): void;
}

const createPlayer = videojs as unknown as (
  el: HTMLElement,
  options: Record<string, unknown>,
) => VjsPlayer;

/**
 * Industry-standard player (Video.js). Native-feeling control bar with scrubber,
 * volume, playback speed, picture-in-picture and fullscreen; responsive 16:9
 * ("fluid"). Plays MP4 directly and HLS (`.m3u8`) via Video.js's built-in HTTP
 * streaming. The `<video>` is created imperatively (the recommended React
 * pattern) so Video.js owns its DOM across re-renders and Strict Mode.
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
    if (playerRef.current || !containerRef.current) return;

    const videoEl = document.createElement("video");
    videoEl.classList.add("video-js", "vjs-big-play-centered");
    videoEl.setAttribute("playsinline", "");
    containerRef.current.appendChild(videoEl);

    playerRef.current = createPlayer(videoEl, {
      controls: true,
      responsive: true,
      fluid: true,
      preload: "metadata",
      poster,
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
      sources: src ? [{ src, type: type ?? "video/mp4" }] : [],
    });

    return () => {
      const player = playerRef.current;
      if (player && !player.isDisposed()) player.dispose();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // init once

  // Swap the source if it changes (e.g. a freshly-signed URL).
  useEffect(() => {
    const player = playerRef.current;
    if (player && src) player.src({ src, type: type ?? "video/mp4" });
  }, [src, type]);

  return (
    <div className={cn("overflow-hidden rounded-xl bg-black", className)} data-vjs-player>
      <div ref={containerRef} />
    </div>
  );
}
