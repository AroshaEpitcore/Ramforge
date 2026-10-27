import { LoginForm } from "@/features/auth/components/login-form";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = buildMetadata({ title: "Sign in" });

export default function LoginPage() {
  // LoginForm reads `useSearchParams()` (callbackUrl); Next requires a Suspense
  // boundary around it so the page can be statically shelled.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
