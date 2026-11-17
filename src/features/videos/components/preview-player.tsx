"use client";

import { VideoPlayer } from "@/components/shared/video-player";
import { PlaybackPlayer } from "@/features/videos/components/playback-player";
import { useState } from "react";

/**
 * Poster with a play button that, on click, loads the real (access-controlled)
 * player. Used for non-free videos: the poster shows a preview, and clicking
 * play resolves the signed source via {@link PlaybackPlayer}.
 */
export function PreviewPlayer({
  videoId,
  poster,
  title,
}: {
  videoId: string;
  poster?: string;
  title?: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return <PlaybackPlayer videoId={videoId} poster={poster} title={title} />;
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play ${title ?? "video"}`}
      className="block w-full cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <VideoPlayer source={{ poster }} title={title} isPreview />
    </button>
  );
}
