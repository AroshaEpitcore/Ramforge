"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Maximize, Pause, Play, Settings, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

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
 * Provider-agnostic player **shell**. It accepts a resolved {@link PlaybackSource}
 * and never imports a specific hosting SDK — swap the real player in later
 * (Mux, Cloudflare Stream, Bunny, hls.js, …) behind this same prop shape.
 *
 * If `source.src` is a direct media URL it plays via the native element;
 * otherwise it renders the poster with a play affordance (scaffold default).
 */
export function VideoPlayer({ source, title, className, isPreview }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  const togglePlay = () => {
    const el = videoRef.current;
    if (el) {
      if (el.paused) void el.play();
      else el.pause();
      return;
    }
    // No real source wired yet — just reflect intent in the shell.
    setPlaying((p) => !p);
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (el) el.muted = !el.muted;
    setMuted((m) => !m);
  };

  return (
    <div
      className={cn(
        "group relative aspect-video w-full overflow-hidden rounded-xl bg-black text-white",
        className,
      )}
    >
      {source.src ? (
        <video
          ref={videoRef}
          src={source.src}
          poster={source.poster}
          className="size-full object-contain"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          playsInline
        />
      ) : (
        <>
          {source.poster && (
            <Image src={source.poster} alt={title ?? "Video"} fill className="object-cover opacity-80" sizes="100vw" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
        </>
      )}

      {/* Center play button */}
      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play"
          className="absolute inset-0 flex items-center justify-center outline-none"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-2xl transition-transform group-hover:scale-105">
            <Play className="size-7 translate-x-0.5 fill-current" />
          </span>
        </button>
      )}

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        {title && <p className="line-clamp-1 text-sm font-medium drop-shadow">{title}</p>}
        {isPreview && <Badge variant="new">Preview</Badge>}
      </div>

      {/* Control bar */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
        {/* Non-functional seek bar (shell) */}
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/25">
          <div className="h-full w-1/3 rounded-full bg-primary" />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-white hover:bg-white/15 hover:text-white"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-white hover:bg-white/15 hover:text-white"
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </Button>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-white hover:bg-white/15 hover:text-white"
              aria-label="Quality settings"
            >
              <Settings className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-white hover:bg-white/15 hover:text-white"
              aria-label="Fullscreen"
              onClick={() => videoRef.current?.requestFullscreen?.()}
            >
              <Maximize className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
