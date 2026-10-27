"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { loadCourseLessons, reorderLessons } from "@/features/admin/actions";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Lesson = { id: string; title: string; position: number };

/** Reorder a course's lessons with up/down controls; saves new 1..n positions. */
export function LessonReorderDialog({
  courseId,
  courseTitle,
  open,
  onOpenChange,
}: {
  courseId: string | null;
  courseTitle: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !courseId) return;
    setLessons(null);
    loadCourseLessons(courseId).then((res) => {
      if (res.ok) setLessons(res.data);
      else toast.error("Could not load lessons", { description: res.error });
    });
  }, [open, courseId]);

  const move = (index: number, dir: -1 | 1) => {
    setLessons((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const save = async () => {
    if (!courseId || !lessons) return;
    setSaving(true);
    const res = await reorderLessons({ courseId, videoIds: lessons.map((l) => l.id) });
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not save order", { description: res.error });
      return;
    }
    toast.success("Lesson order saved");
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reorder lessons — {courseTitle}</DialogTitle>
          <DialogDescription>Use the arrows to set the order lessons play in.</DialogDescription>
        </DialogHeader>

        {lessons === null ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : lessons.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            This course has no lessons yet. Assign videos to it from the video editor.
          </p>
        ) : (
          <ol className="space-y-2">
            {lessons.map((lesson, i) => (
              <li key={lesson.id} className="flex items-center gap-3 rounded-lg border p-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{lesson.title}</span>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Move up"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Move down"
                    disabled={i === lessons.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}

        <DialogFooter>
          <Button onClick={save} loading={saving} disabled={!lessons || lessons.length === 0}>
            Save order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
