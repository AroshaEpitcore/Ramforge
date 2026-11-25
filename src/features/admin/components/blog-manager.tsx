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
import { deleteBlogPost, saveBlogPost } from "@/features/admin/blog-actions";
import { ImageUploadField } from "@/features/admin/components/image-upload-field";
import { PdfUploadField } from "@/features/admin/components/pdf-upload-field";
import { blogPostSchema, type BlogPostInput } from "@/features/admin/schemas";
import { formatDate } from "@/lib/formatters";
import type { AdminBlogPostRow } from "@/server/queries/blog";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

const statusVariant = { PUBLISHED: "success", DRAFT: "warning", ARCHIVED: "muted" } as const;

export function BlogManager({ posts }: { posts: AdminBlogPostRow[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBlogPostRow | null>(null);
  const [deleting, setDeleting] = useState<AdminBlogPostRow | null>(null);

  const onDelete = async () => {
    if (!deleting) return;
    const res = await deleteBlogPost(deleting.id);
    if (!res.ok) toast.error("Could not delete", { description: res.error });
    else {
      toast.success("Post deleted");
      router.refresh();
    }
    setDeleting(null);
  };

  const columns: ColumnDef<AdminBlogPostRow>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: "authorName",
      header: "Author",
      cell: ({ row }) => row.original.authorName ?? "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => formatDate(row.original.updatedAt),
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
          New post
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={posts}
        searchPlaceholder="Search posts…"
        paginationVariant="primary"
      />

      <BlogFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSaved={() => {
          setFormOpen(false);
          router.refresh();
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the post.</AlertDialogDescription>
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

function BlogFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: AdminBlogPostRow | null;
  onSaved: () => void;
}) {
  const defaults: BlogPostInput = {
    id: editing?.id,
    title: editing?.title ?? "",
    slug: editing?.slug ?? "",
    excerpt: editing?.excerpt ?? "",
    body: editing?.body ?? "",
    coverImageUrl: editing?.coverImageUrl ?? "",
    pdfUrl: editing?.pdfUrl ?? "",
    status: editing?.status ?? "DRAFT",
    publishAt: editing?.publishAt ? editing.publishAt.slice(0, 16) : "",
  };

  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BlogPostInput>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: defaults,
  });

  // The dialog stays mounted between opens, so reset to the saved values every
  // time it opens — otherwise unsaved edits (e.g. a removed PDF) linger and make
  // it look as though a change was persisted when the user never clicked Save.
  useEffect(() => {
    if (open) reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset to saved row on open
  }, [open, editing?.id]);

  const onSubmit = async (values: BlogPostInput) => {
    const res = await saveBlogPost(values);
    if (!res.ok) {
      for (const [field, messages] of Object.entries(res.fieldErrors ?? {})) {
        if (messages?.[0]) setError(field as keyof BlogPostInput, { message: messages[0] });
      }
      toast.error("Could not save", { description: res.error });
      return;
    }
    toast.success(editing ? "Post updated" : "Post created");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit post" : "New post"}</DialogTitle>
          <DialogDescription>
            Publish to make it visible on the blog. Use a future “Publish at” to schedule it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="b-title">Title</Label>
            <Input id="b-title" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="b-slug">Slug (optional)</Label>
            <Input id="b-slug" placeholder="auto-generated" {...register("slug")} />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>

          <Controller
            control={control}
            name="coverImageUrl"
            render={({ field }) => (
              <ImageUploadField
                value={field.value ?? ""}
                onChange={field.onChange}
                folder="blog"
                label="Cover image (optional)"
                allowUrl
                previewClassName="aspect-video h-auto"
                hint="Shown at the top of the post and in the blog list — 16:9 works best (e.g. 1280×720 px)."
                error={errors.coverImageUrl?.message as string | undefined}
              />
            )}
          />

          <div className="grid gap-2">
            <Label htmlFor="b-excerpt">Excerpt</Label>
            <Textarea id="b-excerpt" rows={2} {...register("excerpt")} />
            {errors.excerpt && <p className="text-xs text-destructive">{errors.excerpt.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="b-body">Body (optional if you attach a PDF)</Label>
            <Textarea id="b-body" rows={10} {...register("body")} />
            {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
          </div>

          <Controller
            control={control}
            name="pdfUrl"
            render={({ field }) => (
              <PdfUploadField
                value={field.value ?? ""}
                onChange={field.onChange}
                label="PDF article (optional)"
                hint="Upload your blog as a PDF — readers can view and download it on the post page."
                error={errors.pdfUrl?.message as string | undefined}
              />
            )}
          />

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
              <Label htmlFor="b-publish">Publish at (optional)</Label>
              <Input id="b-publish" type="datetime-local" {...register("publishAt")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" loading={isSubmitting}>
              {editing ? "Save changes" : "Create post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
