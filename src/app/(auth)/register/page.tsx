import { RegisterForm } from "@/features/auth/components/register-form";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Create account" });

export default function RegisterPage() {
  return <RegisterForm />;
}
