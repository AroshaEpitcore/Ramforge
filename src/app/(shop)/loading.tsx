import { Container } from "@/components/layout/container";
import { VideoGridSkeleton } from "@/components/shared/video-grid";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <Container className="py-8">
      <Skeleton className="mb-6 h-8 w-48" />
      <VideoGridSkeleton count={8} columns={4} />
    </Container>
  );
}
