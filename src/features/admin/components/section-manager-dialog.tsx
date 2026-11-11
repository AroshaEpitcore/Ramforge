"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  assignLessonSection,
  deleteSection,
  loadCourseSections,
  reorderSections,
  saveSection,
} from "@/features/admin/actions";
import type { CourseSectionsData } from "@/server/queries/admin";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const NONE = "__none__";

/**
 * Manage a course's sections (create / rename / reorder / delete) and assign
 * each lesson to a section. Every change saves immediately, then reloads the
 * course's section data to stay in sync.
 */
export function SectionManagerDialog({
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
  const [data, setData] = useState<CourseSectionsData | null>(null);
  const [busy, setBusy] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const reload = async (id: string) => {
    const res = await loadCourseSections(id);
    if (res.ok) setData(res.data);
    else toast.error("Could not load sections", { description: res.error });
  };

  useEffect(() => {
    if (!open || !courseId) return;
    setData(null);
    setNewTitle("");
    void reload(courseId);
  }, [open, courseId]);

  // Run a mutation, then reload + refresh the page behind the dialog.
  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, failMsg: string) => {
    if (!courseId) return;
    setBusy(true);
    const res = await fn();
    if (!res.ok) toast.error(failMsg, { description: res.error });
    else await reload(courseId);
    setBusy(false);
    router.refresh();
  };

  const addSection = async () => {
    const title = newTitle.trim();
    if (!courseId || !title) return;
    setNewTitle("");
    await run(() => saveSection({ courseId, title }), "Could not add section");
  };

  const rename = async (id: string, title: string) => {
    if (!courseId || !title.trim()) return;
    await run(() => saveSection({ id, courseId, title: title.trim() }), "Could not rename section");
  };

  const move = async (index: number, dir: -1 | 1) => {
    if (!courseId || !data) return;
    const next = [...data.sections];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    await run(
      () => reorderSections({ courseId, sectionIds: next.map((s) => s.id) }),
      "Could not reorder",
    );
  };

  const remove = async (id: string) => {
    await run(() => deleteSection(id), "Could not delete section");
  };

  const assign = async (lessonId: string, sectionId: string | null) => {
    await run(() => assignLessonSection({ lessonId, sectionId }), "Could not move lesson");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sections — {courseTitle}</DialogTitle>
          <DialogDescription>
            Group this course&apos;s lessons into sections. Changes save automatically.
          </DialogDescription>
        </DialogHeader>

        {data === null ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sections */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Sections</h3>
              {data.sections.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No sections yet. Add one below, then assign lessons to it.
                </p>
              ) : (
                <ol className="space-y-2">
                  {data.sections.map((section, i) => (
                    <li key={section.id} className="flex items-center gap-2 rounded-lg border p-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums">
                        {i + 1}
                      </span>
                      <Input
                        defaultValue={section.title}
                        disabled={busy}
                        className="h-8 flex-1"
                        aria-label="Section title"
                        onBlur={(e) => {
                          if (e.target.value.trim() && e.target.value.trim() !== section.title) {
                            void rename(section.id, e.target.value);
                          }
                        }}
                      />
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="Move up"
                          disabled={busy || i === 0}
                          onClick={() => move(i, -1)}
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="Move down"
                          disabled={busy || i === data.sections.length - 1}
                          onClick={() => move(i, 1)}
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          aria-label="Delete section"
                          disabled={busy}
                          onClick={() => remove(section.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="New section title (e.g. Module 1: Getting Started)"
                  value={newTitle}
                  disabled={busy}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void addSection();
                    }
                  }}
                />
                <Button
                  onClick={addSection}
                  disabled={busy || !newTitle.trim()}
                  leftIcon={<Plus />}
                >
                  Add
                </Button>
              </div>
            </section>

            {/* Lesson assignment */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Assign lessons</h3>
              {data.lessons.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  This course has no lessons yet. Assign videos to it from the video editor.
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.lessons.map((lesson) => (
                    <li key={lesson.id} className="flex items-center gap-3 rounded-lg border p-2">
                      <span className="min-w-0 flex-1 truncate text-sm">{lesson.title}</span>
                      <Select
                        value={lesson.sectionId ?? NONE}
                        disabled={busy || data.sections.length === 0}
                        onValueChange={(v) => assign(lesson.id, v === NONE ? null : v)}
                      >
                        <SelectTrigger className="h-8 w-48 shrink-0">
                          <SelectValue placeholder="No section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>No section</SelectItem>
                          {data.sections.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
