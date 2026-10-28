"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Rating } from "@/components/ui/rating";
import { approveReview, deleteReview } from "@/features/reviews/actions";
import { formatDate } from "@/lib/formatters";
import type { AdminReviewRow } from "@/server/queries/reviews";
import { Check, MessageSquare, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ReviewModerator({ reviews }: { reviews: AdminReviewRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (
    id: string,
    fn: (id: string) => Promise<{ ok: boolean; error?: string }>,
    ok: string,
  ) => {
    setBusy(id);
    const res = await fn(id);
    setBusy(null);
    if (!res.ok) toast.error("Action failed", { description: res.error });
    else {
      toast.success(ok);
      router.refresh();
    }
  };

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare />}
        title="No reviews yet"
        description="Customer reviews will appear here for moderation."
      />
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <Card key={r.id}>
          <CardContent className="space-y-2 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{r.authorName}</span>
              <Rating value={r.rating} size="sm" />
              {r.approved ? (
                <Badge variant="success">Approved</Badge>
              ) : (
                <Badge variant="warning">Pending</Badge>
              )}
              <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
              <Link
                href={`/video/${r.videoSlug}`}
                className="ml-auto text-xs text-primary underline-offset-4 hover:underline"
              >
                {r.videoTitle}
              </Link>
            </div>
            {r.title && <p className="font-medium">{r.title}</p>}
            <p className="text-sm text-muted-foreground">{r.body}</p>
            <div className="flex gap-2 pt-1">
              {!r.approved && (
                <Button
                  size="sm"
                  leftIcon={<Check />}
                  loading={busy === r.id}
                  onClick={() => run(r.id, approveReview, "Review approved")}
                >
                  Approve
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                leftIcon={<Trash2 />}
                loading={busy === r.id}
                onClick={() => run(r.id, deleteReview, "Review deleted")}
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
