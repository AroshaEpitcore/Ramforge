import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoCard } from "@/components/shared/video-card";
import { cn } from "@/lib/utils";
import type { Video } from "@/types";
import { Film } from "lucide-react";

export interface VideoGridProps {
  videos: Video[];
  variant?: "default" | "compact";
  className?: string;
  columns?: "auto" | 2 | 3 | 4;
  emptyTitle?: string;
  emptyDescription?: string;
}

const columnClasses: Record<NonNullable<VideoGridProps["columns"]>, string> = {
  auto: "grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
};

export function VideoGrid({
  videos,
  variant = "default",
  className,
  columns = 4,
  emptyTitle = "No videos found",
  emptyDescription = "Try adjusting your filters or search.",
}: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <EmptyState icon={<Film />} title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className={cn("grid gap-4", columnClasses[columns], className)}>
      {videos.map((video, i) => (
        <VideoCard key={video.id} video={video} variant={variant} priority={i < 4} />
      ))}
    </div>
  );
}

/** Loading skeleton matching the grid layout. */
export function VideoGridSkeleton({
  count = 8,
  columns = 4,
}: {
  count?: number;
  columns?: NonNullable<VideoGridProps["columns"]>;
}) {
  return (
    <div className={cn("grid gap-4", columnClasses[columns])}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-xl border bg-card p-0">
          <Skeleton className="aspect-video rounded-b-none" />
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-2 h-5 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
