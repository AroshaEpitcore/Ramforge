import { PlaceholderPage } from "@/components/shared/placeholder";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Coupons" });

export default function AdminCouponsPage() {
  return (
    <PlaceholderPage title="Coupons" description="Create and manage discount coupons." />
  );
}
