import { PlaceholderPage } from "@/components/shared/placeholder";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Reports" });

export default function AdminReportsPage() {
  return (
    <PlaceholderPage title="Reports" description="Sales, revenue and engagement reports." />
  );
}
