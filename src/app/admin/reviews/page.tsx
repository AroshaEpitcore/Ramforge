import { PlaceholderPage } from "@/components/shared/placeholder";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Reviews" });

export default function AdminReviewsPage() {
  return (
    <PlaceholderPage title="Reviews" description="Moderate and respond to customer reviews." />
  );
}
