"use client";

import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

/**
 * Privacy-enhanced YouTube embed (youtube-nocookie). Used for FREE videos so
 * there is no hosting cost. Allowed by the CSP `frame-src` in next.config.ts.
 *
 * When a `poster` is given it shows a custom-thumbnail facade with a play
 * button; clicking it loads the (autoplaying) YouTube iframe. Without a poster
 * it embeds directly.
 */
export function YouTubeEmbed({
  youtubeId,
  title,
  className,
  poster,
}: {
  youtubeId: string;
  title?: string;
  className?: string;
  /** Custom thumbnail shown before playback (click-to-load the embed). */
  poster?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const src = `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1${
    poster ? "&autoplay=1" : ""
  }`;

  return (
    <div
      className={cn("relative aspect-video w-full overflow-hidden rounded-xl bg-black", className)}
    >
      {!poster || playing ? (
        <iframe
          className="absolute inset-0 size-full"
          src={src}
          title={title ?? "Video player"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play ${title ?? "video"}`}
          className="group absolute inset-0"
        >
          <Image src={poster} alt={title ?? "Video"} fill sizes="100vw" className="object-cover" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/25">
            <span className="relative flex size-16 items-center justify-center transition-transform group-hover:scale-105">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/50" />
              <span className="relative flex size-16 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-xl ring-2 ring-white/40">
                <Play className="size-7 translate-x-0.5 fill-current" />
              </span>
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
