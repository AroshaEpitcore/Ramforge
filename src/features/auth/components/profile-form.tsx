"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateProfile } from "@/features/auth/actions";
import { updateProfileSchema, type UpdateProfileInput } from "@/features/auth/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

function initials(name: string, email: string) {
  const base = name.trim() || email;
  return base
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileForm({
  initial,
}: {
  initial: { name: string; email: string; image?: string | null };
}) {
  const router = useRouter();
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: initial.name, email: initial.email },
  });

  const onSubmit = async (values: UpdateProfileInput) => {
    const res = await updateProfile(values);
    if (!res.ok) {
      for (const [field, messages] of Object.entries(res.fieldErrors ?? {})) {
        if (messages?.[0])
          form.setError(field as keyof UpdateProfileInput, { message: messages[0] });
      }
      toast.error("Could not update profile", { description: res.error });
      return;
    }
    toast.success("Profile updated");
    router.refresh();
  };

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {initial.image && <AvatarImage src={initial.image} alt={initial.name} />}
            <AvatarFallback className="text-lg">
              {initials(initial.name, initial.email)}
            </AvatarFallback>
          </Avatar>
          <Button variant="outline" size="sm" disabled>
            Change avatar
          </Button>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md space-y-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" loading={form.formState.isSubmitting}>
              Save changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
