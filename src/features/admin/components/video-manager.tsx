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
import { deleteVideo, saveVideo } from "@/features/admin/actions";
import { videoSchema, type VideoInput } from "@/features/admin/schemas";
import type { AdminVideoRow } from "@/server/queries/admin";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

const NONE = "__none__";
const statusVariant = { PUBLISHED: "success", DRAFT: "warning", ARCHIVED: "muted" } as const;

export function VideoManager({
  videos,
  categories,
  courses,
}: {
  videos: AdminVideoRow[];
  categories: { id: string; name: string }[];
  courses: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminVideoRow | null>(null);
  const [deleting, setDeleting] = useState<AdminVideoRow | null>(null);

  const onDelete = async () => {
    if (!deleting) return;
    const res = await deleteVideo(deleting.id);
    if (!res.ok) toast.error("Could not delete", { description: res.error });
    else {
      toast.success("Video deleted");
      router.refresh();
    }
    setDeleting(null);
  };

  const columns: ColumnDef<AdminVideoRow>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: "courseTitle",
      header: "Course",
      cell: ({ row }) => row.original.courseTitle ?? "—",
    },
    {
      accessorKey: "categoryName",
      header: "Category",
      cell: ({ row }) => row.original.categoryName ?? "—",
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => <Badge variant="outline">{row.original.source}</Badge>,
    },
    {
      accessorKey: "accessMode",
      header: "Access",
      cell: ({ row }) =>
        row.original.accessMode === "FREE" ? (
          <Badge variant="success">Free</Badge>
        ) : (
          <Badge variant="muted">Paid</Badge>
        ),
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
          New video
        </Button>
      </div>
      <DataTable columns={columns} data={videos} searchPlaceholder="Search videos…" />

      <VideoFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        categories={categories}
        courses={courses}
        onSaved={() => {
          setFormOpen(false);
          router.refresh();
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the video record.
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

function VideoFormDialog({
  open,
  onOpenChange,
  editing,
  categories,
  courses,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: AdminVideoRow | null;
  categories: { id: string; name: string }[];
  courses: { id: string; title: string }[];
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VideoInput>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      id: editing?.id,
      title: editing?.title ?? "",
      slug: editing?.slug ?? "",
      description: editing?.description ?? "",
      categoryId: editing?.categoryId ?? "",
      courseId: editing?.courseId ?? "",
      position: editing?.position ?? 0,
      source: editing?.source ?? "YOUTUBE",
      youtubeId: editing?.youtubeId ?? "",
      fullAssetId: editing?.fullAssetId ?? "",
      accessMode: editing?.accessMode === "PAID" ? "PAID" : "FREE",
      priceMajor: editing ? editing.price / 100 : 0,
      status: editing?.status ?? "DRAFT",
      publishAt: editing?.publishAt ? editing.publishAt.slice(0, 16) : "",
      notes: editing?.notes ?? "",
    },
  });

  const source = useWatch({ control, name: "source" });
  const accessMode = useWatch({ control, name: "accessMode" });
  const courseId = useWatch({ control, name: "courseId" });

  const onSubmit = async (values: VideoInput) => {
    const res = await saveVideo(values);
    if (!res.ok) {
      for (const [field, messages] of Object.entries(res.fieldErrors ?? {})) {
        if (messages?.[0]) setError(field as keyof VideoInput, { message: messages[0] });
      }
      toast.error("Could not save", { description: res.error });
      return;
    }
    toast.success(editing ? "Video updated" : "Video created");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit video" : "New video"}</DialogTitle>
          <DialogDescription>
            Free videos use a YouTube embed; paid lessons stream from Mux (upload on the Uploads
            page, then paste the playback id).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="v-title">Title</Label>
            <Input id="v-title" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="v-slug">Slug (optional)</Label>
              <Input id="v-slug" placeholder="auto-generated" {...register("slug")} />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && (
                <p className="text-xs text-destructive">{errors.categoryId.message}</p>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="v-desc">Description</Label>
            <Textarea id="v-desc" rows={3} {...register("description")} />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Course (optional)</Label>
              <Controller
                control={control}
                name="courseId"
                render={({ field }) => (
                  <Select
                    value={field.value || NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Standalone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Standalone (no course)</SelectItem>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {courseId && (
              <div className="grid gap-2">
                <Label htmlFor="v-position">Lesson position</Label>
                <Input
                  id="v-position"
                  type="number"
                  min="0"
                  {...register("position", { valueAsNumber: true })}
                />
                {errors.position && (
                  <p className="text-xs text-destructive">{errors.position.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Source</Label>
              <Controller
                control={control}
                name="source"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YOUTUBE">YouTube (free)</SelectItem>
                      <SelectItem value="MUX">Mux (paid)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {source === "YOUTUBE" ? (
              <div className="grid gap-2">
                <Label htmlFor="v-yt">YouTube video id</Label>
                <Input id="v-yt" placeholder="dQw4w9WgXcQ" {...register("youtubeId")} />
                {errors.youtubeId && (
                  <p className="text-xs text-destructive">{errors.youtubeId.message}</p>
                )}
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="v-asset">Mux playback id</Label>
                <Input
                  id="v-asset"
                  placeholder="from the Uploads page"
                  {...register("fullAssetId")}
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Access</Label>
              <Controller
                control={control}
                name="accessMode"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FREE">Free</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {accessMode === "PAID" && (
              <div className="grid gap-2">
                <Label htmlFor="v-price">Price (major units)</Label>
                <Input
                  id="v-price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("priceMajor", { valueAsNumber: true })}
                />
              </div>
            )}
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
              <Label htmlFor="v-publish">Publish at (optional)</Label>
              <Input id="v-publish" type="datetime-local" {...register("publishAt")} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="v-notes">Lesson notes (optional, markdown)</Label>
            <Textarea id="v-notes" rows={3} {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="submit" loading={isSubmitting}>
              {editing ? "Save changes" : "Create video"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
