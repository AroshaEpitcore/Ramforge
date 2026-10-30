import { PageHeader } from "@/components/layout/page-header";
import { EmailTemplateManager } from "@/features/admin/components/email-template-manager";
import { requirePermission } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";
import { listEmailTemplatesForAdmin } from "@/server/queries/marketing";
import { getCurrentUser } from "@/server/current-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Email templates" });

export default async function AdminEmailsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/emails");
  requirePermission(user, "emailTemplates:manage");

  const templates = await listEmailTemplatesForAdmin();

  return (
    <div className="space-y-6">
      <PageHeader title="Email templates" description="Reusable transactional email content." />
      <EmailTemplateManager templates={templates} />
    </div>
  );
}
