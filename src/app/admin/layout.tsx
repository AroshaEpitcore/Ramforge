import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { isStaff } from "@/lib/rbac";
import { getCurrentUser } from "@/server/current-user";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Admin shell: collapsible role-filtered sidebar + topbar with breadcrumbs and
 * command palette. The user comes from the session; the sidebar is filtered by
 * role and `requirePermission` guards each action. Middleware also restricts
 * `/admin` to staff — this is defence in depth.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin");
  if (!isStaff(user)) redirect("/");

  return (
    <div className="flex min-h-dvh bg-muted/30">
      <AdminSidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar user={user} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
