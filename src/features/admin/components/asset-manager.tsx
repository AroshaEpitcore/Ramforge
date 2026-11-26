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
import { deleteAsset, saveAsset } from "@/features/admin/asset-actions";
import { FileUploadField } from "@/features/admin/components/file-upload-field";
import { ImageUploadField } from "@/features/admin/components/image-upload-field";
import { assetSchema, type AssetInput } from "@/features/admin/schemas";
import type { AdminAssetRow } from "@/server/queries/assets";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, FileUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

const statusVariant = { PUBLISHED: "success", DRAFT: "warning", ARCHIVED: "muted" } as const;

export function AssetManager({ assets }: { assets: AdminAssetRow[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAssetRow | null>(null);
  const [deleting, setDeleting] = useState<AdminAssetRow | null>(null);

  const onDelete = async () => {
    if (!deleting) return;
    const res = await deleteAsset(deleting.id);
    if (!res.ok) toast.error("Could not delete", { description: res.error });
    else {
      toast.success("Asset deleted");
      router.refresh();
    }
    setDeleting(null);
  };

  const columns: ColumnDef<AdminAssetRow>[] = [
    { accessorKey: "position", header: "#" },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      id: "source",
      header: "Source",
      cell: ({ row }) =>
        row.original.externalUrl ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ExternalLink className="size-3.5" /> Link
          </span>
        ) : row.original.fileUrl ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <FileUp className="size-3.5" /> File
          </span>
        ) : (
          "—"
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
          New asset
        </Button>
      </div>
      <DataTable columns={columns} data={assets} searchPlaceholder="Search assets…" />

      <AssetFormDialog
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
            <AlertDialogDescription>This permanently removes the asset.</AlertDialogDescription>
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

function AssetFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: AdminAssetRow | null;
  onSaved: () => void;
}) {
  const defaults: AssetInput = {
    id: editing?.id,
    title: editing?.title ?? "",
    slug: editing?.slug ?? "",
    description: editing?.description ?? "",
    thumbnailUrl: editing?.thumbnailUrl ?? "",
    externalUrl: editing?.externalUrl ?? "",
    fileUrl: editing?.fileUrl ?? "",
    status: editing?.status ?? "DRAFT",
    position: editing?.position ?? 0,
  };

  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssetInput>({ resolver: zodResolver(assetSchema), defaultValues: defaults });

  // Reset to saved values on open so closing without saving discards edits.
  useEffect(() => {
    if (open) reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset to saved row on open
  }, [open, editing?.id]);

  const onSubmit = async (values: AssetInput) => {
    const res = await saveAsset(values);
    if (!res.ok) {
      for (const [field, messages] of Object.entries(res.fieldErrors ?? {})) {
        if (messages?.[0]) setError(field as keyof AssetInput, { message: messages[0] });
      }
      toast.error("Could not save", { description: res.error });
      return;
    }
    toast.success(editing ? "Asset updated" : "Asset created");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit asset" : "New asset"}</DialogTitle>
          <DialogDescription>
            Add a downloadable resource. Paste a link (e.g. Google Drive) or upload a file. Set it
            to Published to show it on the Assets page.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="a-title">Title</Label>
            <Input id="a-title" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="a-slug">Slug (optional)</Label>
              <Input id="a-slug" placeholder="auto-generated" {...register("slug")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="a-position">Position (lower shows first)</Label>
              <Input
                id="a-position"
                type="number"
                min="0"
                {...register("position", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="a-desc">Description (optional)</Label>
            <Textarea id="a-desc" rows={2} {...register("description")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="a-link">Link (Google Drive, etc.)</Label>
            <Input
              id="a-link"
              placeholder="https://drive.google.com/…"
              {...register("externalUrl")}
            />
            <p className="text-xs text-muted-foreground">
              Use a link for large files. Or upload a file below instead — if both are set, the link
              wins.
            </p>
            {errors.externalUrl && (
              <p className="text-xs text-destructive">{errors.externalUrl.message}</p>
            )}
          </div>

          <Controller
            control={control}
            name="fileUrl"
            render={({ field }) => (
              <FileUploadField
                value={field.value ?? ""}
                onChange={field.onChange}
                label="Or upload a file (optional)"
                error={errors.fileUrl?.message as string | undefined}
              />
            )}
          />

          <Controller
            control={control}
            name="thumbnailUrl"
            render={({ field }) => (
              <ImageUploadField
                value={field.value ?? ""}
                onChange={field.onChange}
                folder="assets"
                label="Thumbnail (optional)"
                allowUrl
                previewClassName="aspect-video h-auto"
                hint="A cover image for the asset card — 16:9 works best."
                error={errors.thumbnailUrl?.message as string | undefined}
              />
            )}
          />

          <div className="grid gap-2 sm:max-w-xs">
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

          <DialogFooter>
            <Button type="submit" loading={isSubmitting}>
              {editing ? "Save changes" : "Create asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
