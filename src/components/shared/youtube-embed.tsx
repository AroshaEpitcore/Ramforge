import { cn } from "@/lib/utils";

/**
 * Privacy-enhanced YouTube embed (youtube-nocookie). Used for FREE videos so
 * there is no hosting cost. Allowed by the CSP `frame-src` in next.config.ts.
 */
export function YouTubeEmbed({
  youtubeId,
  title,
  className,
}: {
  youtubeId: string;
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("relative aspect-video w-full overflow-hidden rounded-xl bg-black", className)}
    >
      <iframe
        className="absolute inset-0 size-full"
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
        title={title ?? "Video player"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
