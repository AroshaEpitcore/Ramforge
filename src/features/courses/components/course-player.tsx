"use client";

import { YouTubeEmbed } from "@/components/shared/youtube-embed";
import { VideoPlayer } from "@/components/shared/video-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Duration } from "@/components/ui/duration";
import { Label } from "@/components/ui/label";
import { buyCourse } from "@/features/commerce/actions";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { CourseDetail, Lesson } from "@/types";
import { CheckCircle2, Lock, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Playback = { url?: string; youtubeId?: string; error?: string } | null;

/**
 * Course viewer. Free lessons play inline (YouTube). Paid lessons play when the
 * viewer owns the course (signed Mux URL), otherwise they are locked behind a
 * "Buy course" button (Stripe Checkout). Owned state + payments switch come
 * from the server.
 */
export function CoursePlayer({
  course,
  paymentsEnabled,
  owned,
}: {
  course: CourseDetail;
  paymentsEnabled: boolean;
  owned: boolean;
}) {
  const firstPlayable = course.lessons.find((l) => l.free) ?? course.lessons[0];
  const [activeId, setActiveId] = useState<string | undefined>(firstPlayable?.id);
  const active = course.lessons.find((l) => l.id === activeId) ?? firstPlayable;

  const [playback, setPlayback] = useState<Playback>(null);
  const [consent, setConsent] = useState(false);
  const [buying, setBuying] = useState(false);

  const price = course.salePrice ?? course.price;

  // For a paid, owned lesson, fetch a signed playback source.
  useEffect(() => {
    if (!active || active.free || !owned) {
      setPlayback(null);
      return;
    }
    let cancelled = false;
    setPlayback(null);
    fetch(`/api/videos/${active.id}/playback`)
      .then(async (r) => ({ ok: r.ok, body: await r.json().catch(() => ({})) }))
      .then(({ ok, body }) => {
        if (cancelled) return;
        setPlayback(ok ? { url: body.url, youtubeId: body.youtubeId } : { error: body.error });
      })
      .catch(() => !cancelled && setPlayback({ error: "Playback unavailable." }));
    return () => {
      cancelled = true;
    };
  }, [active, owned]);

  const onBuy = async () => {
    setBuying(true);
    const res = await buyCourse({ id: course.id, waiverConsent: true });
    setBuying(false);
    if (!res.ok) {
      toast.error("Could not start checkout", { description: res.error });
      return;
    }
    window.location.href = res.data.url; // off to Stripe Checkout
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-4">
        <LessonStage lesson={active} owned={owned} playback={playback} />
        {active && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{active.title}</h2>
              {active.free ? (
                <Badge variant="success">Free</Badge>
              ) : (
                <Badge variant="muted" className="gap-1">
                  <Lock className="size-3" /> Paid
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                <Duration seconds={active.durationSec} withIcon />
              </span>
            </div>
            {active.notes && (
              <div className="rounded-lg border bg-card p-4">
                <h3 className="mb-2 text-sm font-semibold">Lesson notes</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {active.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardContent className="p-0">
            <div className="space-y-3 border-b p-4">
              <p className="text-sm text-muted-foreground">
                {course.lessonCount} lessons · {course.freeLessonCount} free
              </p>

              {owned ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="size-3" /> You own this course
                </Badge>
              ) : price > 0 && paymentsEnabled ? (
                <div className="space-y-3">
                  <p className="text-2xl font-bold tabular-nums">{formatCurrency(price)}</p>
                  <Label className="items-start gap-2 font-normal">
                    <Checkbox
                      className="mt-0.5"
                      checked={consent}
                      onCheckedChange={(v) => setConsent(Boolean(v))}
                    />
                    <span className="text-xs text-muted-foreground">
                      I agree my access begins immediately and I waive my 14-day right to cancel.
                    </span>
                  </Label>
                  <Button fullWidth disabled={!consent || buying} loading={buying} onClick={onBuy}>
                    Buy course
                  </Button>
                </div>
              ) : price > 0 ? (
                <Badge variant="muted">Coming soon</Badge>
              ) : null}
            </div>

            <ul className="divide-y">
              {course.lessons.map((lesson, i) => (
                <li key={lesson.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(lesson.id)}
                    className={cn(
                      "flex w-full items-center gap-3 p-3 text-left text-sm transition-colors hover:bg-accent/50",
                      lesson.id === active?.id && "bg-accent/60",
                    )}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                    {lesson.free || owned ? (
                      <Play className="size-4 shrink-0 text-success" />
                    ) : (
                      <Lock className="size-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function LessonStage({
  lesson,
  owned,
  playback,
}: {
  lesson: Lesson | undefined;
  owned: boolean;
  playback: Playback;
}) {
  if (!lesson) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border bg-muted/30 text-muted-foreground">
        No lessons yet.
      </div>
    );
  }

  // Free lesson → YouTube embed.
  if (lesson.free) {
    if (lesson.source === "YOUTUBE" && lesson.youtubeId) {
      return <YouTubeEmbed youtubeId={lesson.youtubeId} title={lesson.title} />;
    }
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border bg-black text-white/70">
        This free lesson is being prepared.
      </div>
    );
  }

  // Paid + owned → play the resolved source.
  if (owned) {
    if (playback === null) {
      return (
        <div className="flex aspect-video w-full items-center justify-center rounded-xl border bg-black text-white/60">
          Loading…
        </div>
      );
    }
    if (playback.youtubeId)
      return <YouTubeEmbed youtubeId={playback.youtubeId} title={lesson.title} />;
    if (playback.url) return <VideoPlayer source={{ src: playback.url }} title={lesson.title} />;
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border bg-black px-6 text-center text-white/70">
        {playback.error ?? "This lesson is still processing."}
      </div>
    );
  }

  // Paid + not owned → locked.
  return (
    <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border bg-black/90 text-center text-white">
      <Lock className="size-8 text-white/80" />
      <p className="max-w-sm px-6 text-sm text-white/80">
        Buy the course to unlock this and every lesson.
      </p>
    </div>
  );
}
