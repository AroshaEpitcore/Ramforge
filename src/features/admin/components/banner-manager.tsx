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
import { Switch } from "@/components/ui/switch";
import { deleteBanner, saveBanner } from "@/features/admin/marketing-actions";
import { bannerSchema, type BannerInput } from "@/features/admin/schemas";
import type { AdminBannerRow } from "@/server/queries/marketing";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

export function BannerManager({ banners }: { banners: AdminBannerRow[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBannerRow | null>(null);
  const [deleting, setDeleting] = useState<AdminBannerRow | null>(null);

  const onDelete = async () => {
    if (!deleting) return;
    const res = await deleteBanner(deleting.id);
    if (!res.ok) toast.error("Could not delete", { description: res.error });
    else {
      toast.success("Banner deleted");
      router.refresh();
    }
    setDeleting(null);
  };

  const columns: ColumnDef<AdminBannerRow>[] = [
    { accessorKey: "position", header: "#" },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) =>
        row.original.active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="muted">Off</Badge>
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
          New banner
        </Button>
      </div>
      <DataTable columns={columns} data={banners} searchPlaceholder="Search banners…" />

      <BannerFormDialog
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

function BannerFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: AdminBannerRow | null;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BannerInput>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      id: editing?.id,
      title: editing?.title ?? "",
      subtitle: editing?.subtitle ?? "",
      eyebrow: editing?.eyebrow ?? "",
      imageUrl: editing?.imageUrl ?? "",
      ctaLabel: editing?.ctaLabel ?? "",
      ctaHref: editing?.ctaHref ?? "",
      position: editing?.position ?? 0,
      active: editing?.active ?? true,
    },
  });

  const onSubmit = async (values: BannerInput) => {
    const res = await saveBanner(values);
    if (!res.ok) {
      for (const [field, messages] of Object.entries(res.fieldErrors ?? {})) {
        if (messages?.[0]) setError(field as keyof BannerInput, { message: messages[0] });
      }
      toast.error("Could not save", { description: res.error });
      return;
    }
    toast.success(editing ? "Banner updated" : "Banner created");
    onSaved();
  };

  const field = (name: keyof BannerInput, label: string, placeholder?: string) => (
    <div className="grid gap-2">
      <Label htmlFor={`b-${name}`}>{label}</Label>
      <Input id={`b-${name}`} placeholder={placeholder} {...register(name)} />
      {errors[name] && (
        <p className="text-xs text-destructive">{errors[name]?.message as string}</p>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit banner" : "New banner"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {field("eyebrow", "Eyebrow (optional)", "NEW")}
          {field("title", "Title")}
          {field("subtitle", "Subtitle (optional)")}
          {field("imageUrl", "Image URL", "https://…")}
          <div className="grid gap-4 sm:grid-cols-2">
            {field("ctaLabel", "Button label (optional)")}
            {field("ctaHref", "Button link (optional)", "/shop")}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="b-position">Position</Label>
            <Input
              id="b-position"
              type="number"
              min="0"
              {...register("position", { valueAsNumber: true })}
            />
          </div>
          <Controller
            control={control}
            name="active"
            render={({ field: f }) => (
              <Label className="flex items-center gap-3 font-normal">
                <Switch checked={f.value} onCheckedChange={f.onChange} />
                Active
              </Label>
            )}
          />
          <DialogFooter>
            <Button type="submit" loading={isSubmitting}>
              {editing ? "Save changes" : "Create banner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
