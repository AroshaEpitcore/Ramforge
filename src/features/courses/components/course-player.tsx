"use client";

import { YouTubeEmbed } from "@/components/shared/youtube-embed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Duration } from "@/components/ui/duration";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { CourseDetail, Lesson } from "@/types";
import { CheckCircle2, Lock, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Course viewer. Free lessons play inline (YouTube for free content); paid
 * lessons are locked until the course is purchased (selling arrives in Phase
 * 4b). While payments are disabled, the price is hidden and a "notify me"
 * prompt is shown instead of a buy button.
 */
export function CoursePlayer({
  course,
  paymentsEnabled,
}: {
  course: CourseDetail;
  paymentsEnabled: boolean;
}) {
  const firstFree = course.lessons.find((l) => l.free) ?? course.lessons[0];
  const [activeId, setActiveId] = useState<string | undefined>(firstFree?.id);
  const active = course.lessons.find((l) => l.id === activeId) ?? firstFree;

  const price = course.salePrice ?? course.price;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-4">
        <LessonStage lesson={active} paymentsEnabled={paymentsEnabled} price={price} />
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
            <div className="border-b p-4">
              <p className="text-sm text-muted-foreground">
                {course.lessonCount} lessons · {course.freeLessonCount} free
              </p>
              {price > 0 &&
                (paymentsEnabled ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-2xl font-bold tabular-nums">{formatCurrency(price)}</p>
                    <Button
                      fullWidth
                      onClick={() => toast.info("Checkout for courses arrives soon.")}
                    >
                      Buy course
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <Badge variant="muted">Coming soon</Badge>
                    <Button
                      fullWidth
                      variant="outline"
                      onClick={() =>
                        toast.success("We'll let you know when this course goes on sale.")
                      }
                    >
                      Notify me
                    </Button>
                  </div>
                ))}
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
                    {lesson.free ? (
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
  paymentsEnabled,
  price,
}: {
  lesson: Lesson | undefined;
  paymentsEnabled: boolean;
  price: number;
}) {
  if (!lesson) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border bg-muted/30 text-muted-foreground">
        No lessons yet.
      </div>
    );
  }

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

  // Paid → locked.
  return (
    <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border bg-black/90 text-center text-white">
      <Lock className="size-8 text-white/80" />
      <p className="max-w-sm px-6 text-sm text-white/80">
        <CheckCircle2 className="mr-1 inline size-4 text-success" />
        Buy the course to unlock this and every lesson.
      </p>
      {paymentsEnabled && price > 0 && (
        <p className="text-lg font-semibold tabular-nums">{formatCurrency(price)}</p>
      )}
    </div>
  );
}
