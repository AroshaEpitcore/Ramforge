"use client";

import { VideoPlayer } from "@/components/shared/video-player";
import { YouTubeEmbed } from "@/components/shared/youtube-embed";
import { Loader2 } from "lucide-react";
import Image from "next/image";
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
 * `/api/videos/[id]/playback` endpoint, then renders:
 *  - YouTube  → privacy-enhanced embed
 *  - Self-hosted (Neon Object Storage / Mux) → {@link VideoPlayer}
 *  - No access / not ready → a clear message (403 / 401 / 409 / 429 from the API)
 *
 * All states use the same 16:9 frame, so there is no size jump while loading.
 */
export function PlaybackPlayer({
  videoId,
  poster,
  title,
  autoPlay,
}: {
  videoId: string;
  poster?: string;
  title?: string;
  /** Begin playback as soon as the source resolves (after a click-to-play). */
  autoPlay?: boolean;
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
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-black px-6 text-center text-sm text-white/80">
        {error}
      </div>
    );
  }

  // Resolving the source — show the poster with a spinner (not a dead play icon).
  if (!resolved) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        {poster && (
          <Image
            src={poster}
            alt={title ?? "Video"}
            fill
            sizes="100vw"
            className="object-cover opacity-70"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="size-10 animate-spin text-white/90" />
        </div>
      </div>
    );
  }

  if (resolved.kind === "youtube") {
    return <YouTubeEmbed youtubeId={resolved.youtubeId} title={title} />;
  }

  // Self-hosted video once resolved; the same component shows the poster while
  // the signed URL is still being fetched (source.src undefined).
  return <VideoPlayer source={{ src: resolved.url, poster }} title={title} autoPlay={autoPlay} />;
}
