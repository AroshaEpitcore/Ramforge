import { PlaceholderPage } from "@/components/shared/placeholder";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Customers" });

export default function AdminCustomersPage() {
  return (
    <PlaceholderPage title="Customers" description="View customers, their orders and library." />
  );
}
