"use client";

import { Button } from "@/components/ui/button";
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
import { deleteCategory, saveCategory } from "@/features/admin/actions";
import { categorySchema, type CategoryInput } from "@/features/admin/schemas";
import type { AdminCategoryRow } from "@/server/queries/admin";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

const NONE = "__none__";

export function CategoryManager({
  categories,
  parents,
}: {
  categories: AdminCategoryRow[];
  parents: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategoryRow | null>(null);
  const [deleting, setDeleting] = useState<AdminCategoryRow | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: AdminCategoryRow) => {
    setEditing(row);
    setFormOpen(true);
  };

  const onDelete = async () => {
    if (!deleting) return;
    const res = await deleteCategory(deleting.id);
    if (!res.ok) toast.error("Could not delete", { description: res.error });
    else {
      toast.success("Category deleted");
      router.refresh();
    }
    setDeleting(null);
  };

  const columns: ColumnDef<AdminCategoryRow>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => <code className="text-xs text-muted-foreground">{row.original.slug}</code>,
    },
    {
      accessorKey: "parentName",
      header: "Parent",
      cell: ({ row }) => row.original.parentName ?? "—",
    },
    { accessorKey: "videoCount", header: "Videos" },
    { accessorKey: "courseCount", header: "Courses" },
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
            onClick={() => openEdit(row.original)}
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
        <Button onClick={openCreate} leftIcon={<Plus />}>
          New category
        </Button>
      </div>
      <DataTable columns={columns} data={categories} searchPlaceholder="Search categories…" />

      <CategoryFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        parents={parents}
        onSaved={() => {
          setFormOpen(false);
          router.refresh();
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Categories with videos or courses must be reassigned first.
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

function CategoryFormDialog({
  open,
  onOpenChange,
  editing,
  parents,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: AdminCategoryRow | null;
  parents: { id: string; name: string }[];
  onSaved: () => void;
}) {
  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      id: editing?.id,
      name: editing?.name ?? "",
      slug: editing?.slug ?? "",
      description: "",
      parentId: "",
    },
  });
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (values: CategoryInput) => {
    const res = await saveCategory(values);
    if (!res.ok) {
      for (const [field, messages] of Object.entries(res.fieldErrors ?? {})) {
        if (messages?.[0]) setError(field as keyof CategoryInput, { message: messages[0] });
      }
      toast.error("Could not save", { description: res.error });
      return;
    }
    toast.success(editing ? "Category updated" : "Category created");
    onSaved();
  };

  // Prevent a category being its own parent.
  const parentOptions = parents.filter((p) => p.id !== editing?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            Categories group videos and courses. Slug is derived if left blank.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cat-slug">Slug (optional)</Label>
            <Input id="cat-slug" placeholder="auto-generated" {...register("slug")} />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea id="cat-desc" rows={3} {...register("description")} />
          </div>
          <div className="grid gap-2">
            <Label>Parent category</Label>
            <Controller
              control={control}
              name="parentId"
              render={({ field }) => (
                <Select
                  value={field.value || NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (top level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None (top level)</SelectItem>
                    {parentOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="submit" loading={isSubmitting}>
              {editing ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
