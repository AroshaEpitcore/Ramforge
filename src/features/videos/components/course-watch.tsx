"use client";

import { cn } from "@/lib/utils";
import type { CourseOutline } from "@/server/queries/videos";
import { Check, ChevronLeft, PanelRightOpen, Play } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Udemy-style course player shell: the player (passed as `children`) sits in the
 * left column while a collapsible "Course content" sidebar lists the lessons on
 * the right. Collapsing the sidebar lets the player grow to the full width.
 */
export function CourseWatch({
  outline,
  currentSlug,
  children,
}: {
  outline: CourseOutline;
  currentSlug: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const totalSec = outline.lessons.reduce((sum, l) => sum + l.durationSec, 0);
  const currentIndex = outline.lessons.findIndex((l) => l.slug === currentSlug);

  return (
    <div className="relative flex w-full flex-1 flex-col lg:flex-row">
      {/* Left column: player + meta. flex-1 so it fills the width when the
          sidebar is collapsed. */}
      <div className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[calc(70dvh*16/9)] p-4">{children}</div>
      </div>

      {/* Re-open handle, shown only when the sidebar is collapsed. */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed top-20 right-0 z-20 flex items-center gap-2 rounded-l-lg border border-r-0 border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
          aria-label="Show course content"
        >
          <PanelRightOpen className="size-4" />
          <span className="hidden sm:inline">Course content</span>
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "shrink-0 border-white/10 bg-white/[0.03] transition-[width] duration-300 ease-in-out",
          "lg:h-[calc(100dvh_-_3.5rem)] lg:overflow-hidden lg:border-l",
          open ? "w-full lg:w-[360px]" : "w-full lg:w-0 lg:border-l-0",
          !open && "hidden lg:block",
        )}
      >
        <div className="flex h-full w-full flex-col lg:w-[360px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="text-base font-semibold text-white">Course content</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Collapse course content"
            >
              <ChevronLeft className="size-5" />
            </button>
          </div>

          {/* Course title + summary */}
          <div className="border-b border-white/10 px-4 py-3">
            <p className="line-clamp-2 text-sm font-medium text-white">{outline.title}</p>
            <p className="mt-1 text-xs text-white/50">
              {outline.lessons.length} lessons · {formatDuration(totalSec)}
            </p>
          </div>

          {/* Lesson list */}
          <ol className="min-h-0 flex-1 overflow-y-auto">
            {outline.lessons.map((lesson, i) => {
              const active = lesson.slug === currentSlug;
              const completed = currentIndex >= 0 && i < currentIndex;
              return (
                <li key={lesson.id}>
                  <Link
                    href={`/watch/${lesson.slug}`}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex gap-3 border-b border-white/5 px-4 py-3 transition-colors",
                      active
                        ? "border-l-2 border-l-primary bg-primary/15"
                        : "border-l-2 border-l-transparent hover:bg-white/5",
                    )}
                  >
                    {/* Completion / status box */}
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[3px] border",
                        completed
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-white/30",
                      )}
                    >
                      {completed && <Check className="size-3" strokeWidth={3} />}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "flex items-center gap-1.5 text-sm",
                          active ? "font-semibold text-white" : "text-white/85",
                        )}
                      >
                        {active && <Play className="size-3 shrink-0 fill-primary text-primary" />}
                        <span className="truncate">
                          {i + 1}. {lesson.title}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs text-white/45">
                        {formatDuration(lesson.durationSec)}
                        {lesson.accessMode === "FREE" && " · Free preview"}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </aside>
    </div>
  );
}
