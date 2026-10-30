import { PageHeader } from "@/components/layout/page-header";
import { SettingsPanel } from "@/features/admin/components/settings-panel";
import { requirePermission } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";
import { getCurrentUser } from "@/server/current-user";
import { getVatRatePercent, isPaymentsEnabled } from "@/server/services/settings";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Settings" });

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/settings");
  requirePermission(user, "settings:manage");

  const [paymentsEnabled, vatRate] = await Promise.all([isPaymentsEnabled(), getVatRatePercent()]);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Store configuration and launch switches." />
      <SettingsPanel paymentsEnabled={paymentsEnabled} vatRate={vatRate} />
    </div>
  );
}
