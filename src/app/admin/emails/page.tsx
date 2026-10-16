import { PlaceholderPage } from "@/components/shared/placeholder";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Email templates" });

export default function AdminEmailsPage() {
  return (
    <PlaceholderPage
      title="Email templates"
      description="Edit transactional emails (purchase confirmation with a “Watch now” link, password reset)."
    />
  );
}
