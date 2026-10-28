import { PageHeader } from "@/components/layout/page-header";
import { ReviewModerator } from "@/features/admin/components/review-moderator";
import { requirePermission } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";
import { listReviewsForAdmin } from "@/server/queries/reviews";
import { getCurrentUser } from "@/server/current-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Reviews" });

export default async function AdminReviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/reviews");
  requirePermission(user, "reviews:moderate");

  const reviews = await listReviewsForAdmin();

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" description="Approve or remove customer reviews." />
      <ReviewModerator reviews={reviews} />
    </div>
  );
}
