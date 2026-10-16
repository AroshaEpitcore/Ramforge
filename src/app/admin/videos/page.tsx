import { PlaceholderPage } from "@/components/shared/placeholder";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Videos" });

export default function AdminVideosPage() {
  return (
    <PlaceholderPage
      title="Videos"
      description="Create, edit, publish and price videos. Set access mode, downloads and rentals."
      note="The video CRUD + data table is built on top of the DataTable and form primitives in this scaffold."
    />
  );
}
