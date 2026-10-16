import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { getCurrentUserAs } from "@/server/current-user";
import type { ReactNode } from "react";

/**
 * Admin shell: collapsible role-filtered sidebar + topbar with breadcrumbs and
 * command palette. Previewed as SUPER_ADMIN so every nav item is visible; in
 * production the user comes from the session and `requirePermission` guards
 * each action. Middleware additionally restricts `/admin` to staff.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUserAs("SUPER_ADMIN");

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
