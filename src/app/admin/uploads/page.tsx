import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { UploadDemo } from "@/features/admin/components/upload-demo";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Uploads" });

export default function AdminUploadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload videos"
        description="Upload large source videos, thumbnails and preview clips."
      />
      <Card>
        <CardContent className="pt-6">
          <UploadDemo />
        </CardContent>
      </Card>
    </div>
  );
}
