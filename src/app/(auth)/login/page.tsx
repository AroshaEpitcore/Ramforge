import { LoginForm } from "@/features/auth/components/login-form";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Sign in" });

export default function LoginPage() {
  return <LoginForm />;
}
