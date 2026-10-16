import { PlaceholderPage } from "@/components/shared/placeholder";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Access grants" });

export default function AdminAccessPage() {
  return (
    <PlaceholderPage
      title="Access grants"
      description="Grant or revoke access manually, set download limits, and see who bought or watched each video."
    />
  );
}
