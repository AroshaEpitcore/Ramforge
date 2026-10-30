import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = buildMetadata({ title: "Reset password" });

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
