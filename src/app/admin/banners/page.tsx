import { PlaceholderPage } from "@/components/shared/placeholder";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Banners" });

export default function AdminBannersPage() {
  return (
    <PlaceholderPage title="Homepage banners" description="Manage hero banners and their ordering." />
  );
}
