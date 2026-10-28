import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/formatters";
import { requirePermission } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";
import { listActivity } from "@/server/queries/admin-ops";
import { getCurrentUser } from "@/server/current-user";
import { Activity } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Activity log" });

export default async function AdminActivityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/activity");
  requirePermission(user, "activity:read");

  const rows = await listActivity();

  return (
    <div className="space-y-6">
      <PageHeader title="Activity log" description="Recent actions across the store." />
      {rows.length === 0 ? (
        <EmptyState
          icon={<Activity />}
          title="No activity yet"
          description="Logged actions will appear here."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Actor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(a.createdAt, "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{a.action}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.entity
                      ? `${a.entity}${a.entityId ? ` · ${a.entityId.slice(0, 8)}` : ""}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.actor ?? "system"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
