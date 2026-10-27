"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deleteCourse, saveCourse } from "@/features/admin/actions";
import { LessonReorderDialog } from "@/features/admin/components/lesson-reorder-dialog";
import { courseSchema, type CourseInput } from "@/features/admin/schemas";
import { formatCurrency } from "@/lib/formatters";
import type { AdminCourseRow } from "@/server/queries/admin";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { ListOrdered, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

const NONE = "__none__";
const statusVariant = { PUBLISHED: "success", DRAFT: "warning", ARCHIVED: "muted" } as const;

export function CourseManager({
  courses,
  categories,
}: {
  courses: AdminCourseRow[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCourseRow | null>(null);
  const [deleting, setDeleting] = useState<AdminCourseRow | null>(null);
  const [reordering, setReordering] = useState<AdminCourseRow | null>(null);

  const onDelete = async () => {
    if (!deleting) return;
    const res = await deleteCourse(deleting.id);
    if (!res.ok) toast.error("Could not delete", { description: res.error });
    else {
      toast.success("Course deleted");
      router.refresh();
    }
    setDeleting(null);
  };

  const columns: ColumnDef<AdminCourseRow>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: "categoryName",
      header: "Category",
      cell: ({ row }) => row.original.categoryName ?? "—",
    },
    { accessorKey: "lessonCount", header: "Lessons" },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => (row.original.price > 0 ? formatCurrency(row.original.price) : "Free"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Reorder lessons"
            onClick={() => setReordering(row.original)}
          >
            <ListOrdered className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Edit"
            onClick={() => {
              setEditing(row.original);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive"
            aria-label="Delete"
            onClick={() => setDeleting(row.original)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          leftIcon={<Plus />}
        >
          New course
        </Button>
      </div>
      <DataTable columns={columns} data={courses} searchPlaceholder="Search courses…" />

      <CourseFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        categories={categories}
        onSaved={() => {
          setFormOpen(false);
          router.refresh();
        }}
      />

      <LessonReorderDialog
        courseId={reordering?.id ?? null}
        courseTitle={reordering?.title ?? ""}
        open={!!reordering}
        onOpenChange={(o) => !o && setReordering(null)}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The course is removed; its lessons are kept as standalone videos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CourseFormDialog({
  open,
  onOpenChange,
  editing,
  categories,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: AdminCourseRow | null;
  categories: { id: string; name: string }[];
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      id: editing?.id,
      title: editing?.title ?? "",
      slug: editing?.slug ?? "",
      description: editing?.description ?? "",
      categoryId: editing?.categoryId ?? "",
      priceMajor: editing ? editing.price / 100 : 0,
      status: editing?.status ?? "DRAFT",
      publishAt: editing?.publishAt ? editing.publishAt.slice(0, 16) : "",
    },
  });

  const onSubmit = async (values: CourseInput) => {
    const res = await saveCourse(values);
    if (!res.ok) {
      for (const [field, messages] of Object.entries(res.fieldErrors ?? {})) {
        if (messages?.[0]) setError(field as keyof CourseInput, { message: messages[0] });
      }
      toast.error("Could not save", { description: res.error });
      return;
    }
    toast.success(editing ? "Course updated" : "Course created");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit course" : "New course"}</DialogTitle>
          <DialogDescription>
            Add lessons by assigning videos to this course (with a position).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="c-title">Title</Label>
            <Input id="c-title" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-slug">Slug (optional)</Label>
            <Input id="c-slug" placeholder="auto-generated" {...register("slug")} />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-desc">Description</Label>
            <Textarea id="c-desc" rows={3} {...register("description")} />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    value={field.value || NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>None</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-price">Price (major units)</Label>
              <Input
                id="c-price"
                type="number"
                step="0.01"
                min="0"
                {...register("priceMajor", { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-publish">Publish at (optional)</Label>
              <Input id="c-publish" type="datetime-local" {...register("publishAt")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" loading={isSubmitting}>
              {editing ? "Save changes" : "Create course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
