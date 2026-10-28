"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitReview } from "@/features/reviews/actions";
import { reviewSchema } from "@/features/reviews/schemas";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ReviewForm({
  videoId,
  existing,
}: {
  videoId: string;
  existing?: { rating: number; title: string | null; body: string; approved: boolean } | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = reviewSchema.safeParse({ videoId, rating, title, body });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your review.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const res = await submitReview(parsed.data);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      toast.error("Could not submit review", { description: res.error });
      return;
    }
    toast.success("Review submitted", { description: "It will appear once approved." });
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{existing ? "Edit your review" : "Write a review"}</h3>
        {existing && !existing.approved && (
          <span className="text-xs text-muted-foreground">Pending approval</span>
        )}
      </div>

      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n)}
            className="p-0.5"
          >
            <Star
              className={cn(
                "size-6 transition-colors",
                (hover || rating) >= n ? "fill-primary text-primary" : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="r-title">Title (optional)</Label>
        <Input
          id="r-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="r-body">Review</Label>
        <Textarea
          id="r-body"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          placeholder="What did you think?"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button type="submit" loading={submitting}>
        {existing ? "Update review" : "Submit review"}
      </Button>
    </form>
  );
}
