import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { MuxUploadPanel } from "@/features/admin/components/mux-upload-panel";
import { UploadDemo } from "@/features/admin/components/upload-demo";
import { env } from "@/lib/env";
import { requirePermission } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";
import { listCategoryOptions } from "@/server/queries/admin";
import { getCurrentUser } from "@/server/current-user";
import { Info } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Uploads" });

export default async function AdminUploadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/uploads");
  requirePermission(user, "videos:upload");

  const muxReady = env.VIDEO_PROVIDER === "mux";
  const categories = await listCategoryOptions();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload videos"
        description="Upload large source videos for paid lessons. Free videos use YouTube — add those from the Videos editor."
      />

      {muxReady ? (
        <MuxUploadPanel categories={categories} />
      ) : (
        <>
          <Alert variant="info">
            <Info />
            <AlertTitle>Mux is not configured</AlertTitle>
            <AlertDescription>
              Real uploads stream directly to Mux. Set <code>VIDEO_PROVIDER=mux</code> and the{" "}
              <code>MUX_*</code> keys in your environment to enable them. The demo below shows the
              upload UI with simulated progress.
            </AlertDescription>
          </Alert>
          <Card>
            <CardContent className="pt-6">
              <UploadDemo />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
