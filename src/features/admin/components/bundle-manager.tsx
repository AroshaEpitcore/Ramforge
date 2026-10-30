"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
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
import { deleteBundle, saveBundle } from "@/features/admin/bundle-actions";
import { formatCurrency } from "@/lib/formatters";
import type { AdminBundleRow } from "@/server/queries/bundles";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type VideoOpt = { id: string; title: string };
type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export function BundleManager({
  bundles,
  videos,
}: {
  bundles: AdminBundleRow[];
  videos: VideoOpt[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBundleRow | null>(null);
  const [deleting, setDeleting] = useState<AdminBundleRow | null>(null);

  const onDelete = async () => {
    if (!deleting) return;
    const res = await deleteBundle(deleting.id);
    if (!res.ok) toast.error("Could not delete", { description: res.error });
    else {
      toast.success("Bundle deleted");
      router.refresh();
    }
    setDeleting(null);
  };

  const columns: ColumnDef<AdminBundleRow>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    { accessorKey: "videoCount", header: "Videos" },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => (row.original.price > 0 ? formatCurrency(row.original.price) : "Free"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) =>
        row.original.status === "PUBLISHED" ? (
          <Badge variant="success">Published</Badge>
        ) : (
          <Badge variant="muted">{row.original.status}</Badge>
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
          New bundle
        </Button>
      </div>
      <DataTable columns={columns} data={bundles} searchPlaceholder="Search bundles…" />

      <BundleFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        videos={videos}
        onSaved={() => {
          setFormOpen(false);
          router.refresh();
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.title}”?</AlertDialogTitle>
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

function BundleFormDialog({
  open,
  onOpenChange,
  editing,
  videos,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: AdminBundleRow | null;
  videos: VideoOpt[];
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(editing?.thumbnailUrl ?? "");
  const [priceMajor, setPriceMajor] = useState(editing ? editing.price / 100 : 0);
  const [status, setStatus] = useState<Status>(editing?.status ?? "DRAFT");
  const [selected, setSelected] = useState<string[]>(editing?.videoIds ?? []);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await saveBundle({
      id: editing?.id,
      title,
      slug,
      description,
      thumbnailUrl,
      priceMajor: Number(priceMajor) || 0,
      status,
      videoIds: selected,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not save", { description: res.error });
      return;
    }
    toast.success(editing ? "Bundle updated" : "Bundle created");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit bundle" : "New bundle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="bn-title">Title</Label>
            <Input id="bn-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="bn-slug">Slug (optional)</Label>
              <Input
                id="bn-slug"
                placeholder="auto"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bn-price">Price (major units)</Label>
              <Input
                id="bn-price"
                type="number"
                step="0.01"
                min="0"
                value={priceMajor}
                onChange={(e) => setPriceMajor(e.target.valueAsNumber)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bn-desc">Description</Label>
            <Textarea
              id="bn-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="bn-thumb">Thumbnail URL (optional)</Label>
              <Input
                id="bn-thumb"
                placeholder="https://…"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Videos in this bundle ({selected.length})</Label>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
              {videos.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">No videos yet.</p>
              ) : (
                videos.map((v) => (
                  <label
                    key={v.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-accent/50"
                  >
                    <Checkbox
                      checked={selected.includes(v.id)}
                      onCheckedChange={() => toggle(v.id)}
                    />
                    <span className="truncate">{v.title}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : "Create bundle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
