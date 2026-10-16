import { PlaceholderPage } from "@/components/shared/placeholder";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Categories" });

export default function AdminCategoriesPage() {
  return (
    <PlaceholderPage
      title="Categories"
      description="Manage categories and sub-categories (self-referencing tree)."
    />
  );
}
