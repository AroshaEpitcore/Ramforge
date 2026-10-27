import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { CourseSummary } from "@/types";
import { GraduationCap, PlayCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/** Storefront course card. Server component (no client hooks). */
export function CourseCard({
  course,
  paymentsEnabled,
  className,
}: {
  course: CourseSummary;
  paymentsEnabled: boolean;
  className?: string;
}) {
  const price = course.salePrice ?? course.price;
  const isPaid = price > 0;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20",
        className,
      )}
    >
      <Link
        href={`/courses/${course.slug}`}
        className="relative block aspect-video overflow-hidden"
      >
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/25 to-background">
            <GraduationCap className="size-10 text-primary/70" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          {!isPaid && <Badge variant="success">Free</Badge>}
          {course.freeLessonCount > 0 && isPaid && (
            <Badge variant="new">
              {course.freeLessonCount} free lesson{course.freeLessonCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {course.category && (
          <span className="text-xs font-medium text-primary">{course.category.name}</span>
        )}
        <h3 className="leading-snug font-semibold">
          <Link href={`/courses/${course.slug}`} className="line-clamp-2">
            {course.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-sm">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <PlayCircle className="size-4" />
            {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}
          </span>
          {isPaid ? (
            paymentsEnabled ? (
              <span className="font-semibold tabular-nums">{formatCurrency(price)}</span>
            ) : (
              <Badge variant="muted">Coming soon</Badge>
            )
          ) : (
            <span className="font-semibold text-success">Free</span>
          )}
        </div>
      </div>
    </article>
  );
}
