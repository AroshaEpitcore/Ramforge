import { PlaceholderPage } from "@/components/shared/placeholder";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Activity log" });

export default function AdminActivityPage() {
  return (
    <PlaceholderPage title="Activity log" description="Audit trail of admin and system actions." />
  );
}
