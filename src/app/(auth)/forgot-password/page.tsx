import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Forgot password" });

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
