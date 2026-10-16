import { PlaceholderPage } from "@/components/shared/placeholder";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Bundles" });

export default function AdminBundlesPage() {
  return (
    <PlaceholderPage title="Bundles" description="Create and manage video bundles and pricing." />
  );
}
