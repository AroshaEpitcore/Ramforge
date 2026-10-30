import { PageHeader } from "@/components/layout/page-header";
import { UsersManager } from "@/features/admin/components/users-manager";
import { requirePermission } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";
import { listCustomers } from "@/server/queries/admin-ops";
import { getCurrentUser } from "@/server/current-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Users & roles" });

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/users");
  requirePermission(user, "roles:manage");

  const users = await listCustomers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & roles"
        description="Assign roles. You can't change your own role."
      />
      <UsersManager users={users} currentUserId={user.id} />
    </div>
  );
}
