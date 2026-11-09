"use client";

import { VideoJsPlayer } from "@/components/shared/videojs-player";
import { YouTubeEmbed } from "@/components/shared/youtube-embed";
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
 *  - Self-hosted (Neon Object Storage / Mux) → Video.js (industry-standard controls)
 *  - No access / not ready → a clear message (403 / 401 / 409 / 429 from the API)
 */
export function PlaybackPlayer({
  videoId,
  poster,
  title,
}: {
  videoId: string;
  poster?: string;
  title?: string;
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

  if (resolved?.kind === "youtube") {
    return <YouTubeEmbed youtubeId={resolved.youtubeId} title={title} />;
  }

  if (resolved?.kind === "mux") {
    return <VideoJsPlayer src={resolved.url} type="video/mp4" poster={poster} />;
  }

  // Loading: show the poster in a 16:9 frame until the source resolves.
  return (
    <div
      className="aspect-video w-full rounded-xl bg-black bg-cover bg-center"
      style={poster ? { backgroundImage: `url(${poster})` } : undefined}
    />
  );
}
