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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteEmailTemplate, saveEmailTemplate } from "@/features/admin/marketing-actions";
import { emailTemplateSchema, type EmailTemplateInput } from "@/features/admin/schemas";
import type { AdminEmailTemplateRow } from "@/server/queries/marketing";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function EmailTemplateManager({ templates }: { templates: AdminEmailTemplateRow[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminEmailTemplateRow | null>(null);
  const [deleting, setDeleting] = useState<AdminEmailTemplateRow | null>(null);

  const onDelete = async () => {
    if (!deleting) return;
    const res = await deleteEmailTemplate(deleting.id);
    if (!res.ok) toast.error("Could not delete", { description: res.error });
    else {
      toast.success("Template deleted");
      router.refresh();
    }
    setDeleting(null);
  };

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
          New template
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={<Mail />}
          title="No templates"
          description="Create reusable email content."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardContent className="space-y-1 py-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Edit"
                      onClick={() => {
                        setEditing(t);
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
                      onClick={() => setDeleting(t)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <code className="text-xs text-muted-foreground">{t.key}</code>
                <p className="truncate text-sm text-muted-foreground">{t.subject}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TemplateFormDialog
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
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
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

function TemplateFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: AdminEmailTemplateRow | null;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmailTemplateInput>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      id: editing?.id,
      key: editing?.key ?? "",
      name: editing?.name ?? "",
      subject: editing?.subject ?? "",
      body: editing?.body ?? "",
    },
  });

  const onSubmit = async (values: EmailTemplateInput) => {
    const res = await saveEmailTemplate(values);
    if (!res.ok) {
      for (const [field, messages] of Object.entries(res.fieldErrors ?? {})) {
        if (messages?.[0]) setError(field as keyof EmailTemplateInput, { message: messages[0] });
      }
      toast.error("Could not save", { description: res.error });
      return;
    }
    toast.success(editing ? "Template updated" : "Template created");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit template" : "New template"}</DialogTitle>
          <DialogDescription>Use placeholders like {"{{name}}"} in the body.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="t-key">Key</Label>
              <Input id="t-key" placeholder="purchase_confirmation" {...register("key")} />
              {errors.key && <p className="text-xs text-destructive">{errors.key.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="t-name">Name</Label>
              <Input id="t-name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="t-subject">Subject</Label>
            <Input id="t-subject" {...register("subject")} />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="t-body">Body</Label>
            <Textarea id="t-body" rows={8} {...register("body")} />
            {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" loading={isSubmitting}>
              {editing ? "Save changes" : "Create template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
