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
import { Switch } from "@/components/ui/switch";
import { deleteCoupon, saveCoupon } from "@/features/admin/coupon-actions";
import { couponSchema, type CouponInput } from "@/features/admin/schemas";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { AdminCouponRow } from "@/server/queries/admin";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

function describeValue(c: AdminCouponRow) {
  return c.type === "PERCENT" ? `${c.amount}% off` : `${formatCurrency(c.amount)} off`;
}

export function CouponManager({ coupons }: { coupons: AdminCouponRow[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCouponRow | null>(null);
  const [deleting, setDeleting] = useState<AdminCouponRow | null>(null);

  const onDelete = async () => {
    if (!deleting) return;
    const res = await deleteCoupon(deleting.id);
    if (!res.ok) toast.error("Could not delete", { description: res.error });
    else {
      toast.success("Coupon deleted");
      router.refresh();
    }
    setDeleting(null);
  };

  const columns: ColumnDef<AdminCouponRow>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => <code className="font-medium">{row.original.code}</code>,
    },
    { id: "value", header: "Value", cell: ({ row }) => describeValue(row.original) },
    {
      id: "redemptions",
      header: "Used",
      cell: ({ row }) =>
        `${row.original.timesRedeemed}${row.original.maxRedemptions ? ` / ${row.original.maxRedemptions}` : ""}`,
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
      accessorKey: "expiresAt",
      header: "Expires",
      cell: ({ row }) => (row.original.expiresAt ? formatDate(row.original.expiresAt) : "—"),
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
          New coupon
        </Button>
      </div>
      <DataTable columns={columns} data={coupons} searchPlaceholder="Search coupons…" />

      <CouponFormDialog
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
            <AlertDialogTitle>Delete “{deleting?.code}”?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
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

function CouponFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: AdminCouponRow | null;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CouponInput>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      id: editing?.id,
      code: editing?.code ?? "",
      type: editing?.type ?? "PERCENT",
      amount: editing ? (editing.type === "FIXED" ? editing.amount / 100 : editing.amount) : 10,
      active: editing?.active ?? true,
      maxRedemptions: editing?.maxRedemptions ?? 0,
      expiresAt: editing?.expiresAt ? editing.expiresAt.slice(0, 16) : "",
    },
  });

  const type = useWatch({ control, name: "type" });

  const onSubmit = async (values: CouponInput) => {
    const res = await saveCoupon(values);
    if (!res.ok) {
      for (const [field, messages] of Object.entries(res.fieldErrors ?? {})) {
        if (messages?.[0]) setError(field as keyof CouponInput, { message: messages[0] });
      }
      toast.error("Could not save", { description: res.error });
      return;
    }
    toast.success(editing ? "Coupon updated" : "Coupon created");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit coupon" : "New coupon"}</DialogTitle>
          <DialogDescription>Discount codes customers enter at checkout.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="cp-code">Code</Label>
            <Input id="cp-code" placeholder="SAVE20" {...register("code")} />
            {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENT">Percentage</SelectItem>
                      <SelectItem value="FIXED">Fixed amount</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cp-amount">
                {type === "PERCENT" ? "Percent off" : "Amount off (major)"}
              </Label>
              <Input
                id="cp-amount"
                type="number"
                step={type === "PERCENT" ? "1" : "0.01"}
                min="0"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="cp-max">Max redemptions (0 = unlimited)</Label>
              <Input
                id="cp-max"
                type="number"
                min="0"
                {...register("maxRedemptions", { valueAsNumber: true })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cp-exp">Expires (optional)</Label>
              <Input id="cp-exp" type="datetime-local" {...register("expiresAt")} />
            </div>
          </div>
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <Label className="flex items-center gap-3 font-normal">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Active
              </Label>
            )}
          />
          <DialogFooter>
            <Button type="submit" loading={isSubmitting}>
              {editing ? "Save changes" : "Create coupon"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
