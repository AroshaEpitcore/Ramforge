"use client";

import { VideoPlayer } from "@/components/shared/video-player";
import { YouTubeEmbed } from "@/components/shared/youtube-embed";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface PlaybackResponse {
  source?: "youtube" | "mux";
  youtubeId?: string;
  url?: string;
  error?: string;
}

type Resolved = { kind: "youtube"; youtubeId: string } | { kind: "mux"; url: string };

/**
 * Client player that resolves a real playback source from the access-controlled
 * `/api/videos/[id]/playback` endpoint, then renders the right surface:
 *  - YouTube  → privacy-enhanced embed
 *  - Self-hosted (Neon Object Storage / Mux) → native `<video>` via {@link VideoPlayer}
 *  - No access / not ready → a clear message (403 / 401 / 409 / 429 from the API)
 */
export function PlaybackPlayer({
  videoId,
  poster,
  title,
  isPreview,
  fit = "aspect",
}: {
  videoId: string;
  poster?: string;
  title?: string;
  isPreview?: boolean;
  fit?: "aspect" | "screen";
}) {
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}/playback`);
        const body = (await res.json().catch(() => ({}))) as PlaybackResponse;
        if (!active) return;
        if (!res.ok) {
          setError(body.error ?? "This video can't be played right now.");
        } else if (body.source === "youtube" && body.youtubeId) {
          setResolved({ kind: "youtube", youtubeId: body.youtubeId });
        } else if (body.url) {
          setResolved({ kind: "mux", url: body.url });
        } else {
          setError("This video can't be played right now.");
        }
      } catch {
        if (active) setError("This video can't be played right now.");
      }
    })();
    return () => {
      active = false;
    };
  }, [videoId]);

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-black px-6 text-center text-sm text-white/80",
          fit === "screen" ? "size-full" : "aspect-video w-full rounded-xl",
        )}
      >
        {error}
      </div>
    );
  }

  if (resolved?.kind === "youtube") {
    if (fit === "screen") {
      return (
        <div className="flex size-full items-center justify-center">
          <YouTubeEmbed
            youtubeId={resolved.youtubeId}
            title={title}
            className="max-h-full w-full max-w-[calc(100vh*16/9)]"
          />
        </div>
      );
    }
    return <YouTubeEmbed youtubeId={resolved.youtubeId} title={title} />;
  }

  return (
    <VideoPlayer
      source={{ src: resolved?.kind === "mux" ? resolved.url : undefined, poster }}
      title={title}
      isPreview={isPreview}
      fit={fit}
    />
  );
}
