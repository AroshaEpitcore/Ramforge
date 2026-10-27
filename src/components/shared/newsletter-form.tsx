"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeNewsletter } from "@/features/marketing/actions";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type Values = z.infer<typeof schema>;

/** Newsletter signup wired to the `subscribeNewsletter` server action. */
export function NewsletterForm({
  className,
  source = "footer",
}: {
  className?: string;
  source?: "footer" | "post-video" | "coming-soon";
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const onSubmit = async (values: Values) => {
    const res = await subscribeNewsletter({ email: values.email, source });
    if (!res.ok) {
      setError("email", { message: res.fieldErrors?.email?.[0] ?? res.error });
      toast.error("Could not subscribe", { description: res.error });
      return;
    }
    toast.success("You're subscribed!", { description: `We'll send updates to ${values.email}.` });
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-2", className)}
      noValidate
    >
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="you@example.com"
          aria-label="Email address"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        <Button type="submit" loading={isSubmitting}>
          Subscribe
        </Button>
      </div>
      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
    </form>
  );
}
