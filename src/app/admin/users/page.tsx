import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";
import type { Role } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Users & roles" });

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  STORE_MANAGER: "Store Manager",
  CONTENT_UPLOADER: "Content Uploader",
  SUPPORT_STAFF: "Support Staff",
  CUSTOMER: "Customer",
};

export default function AdminUsersPage() {
  const roles = Object.keys(ROLE_PERMISSIONS) as Role[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & roles"
        description="Role-based access control. Permissions are defined in lib/rbac.ts and enforced server-side."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => {
          const perms = ROLE_PERMISSIONS[role];
          return (
            <Card key={role}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {ROLE_LABELS[role]}
                  <Badge variant="muted">{perms.length} permissions</Badge>
                </CardTitle>
                <CardDescription>
                  {role === "SUPER_ADMIN" ? "Full access to everything." : null}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {perms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No admin permissions.</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {perms.slice(0, 10).map((p) => (
                      <Badge key={p} variant="outline" className="font-mono text-[10px]">
                        {p}
                      </Badge>
                    ))}
                    {perms.length > 10 && (
                      <Badge variant="muted" className="text-[10px]">
                        +{perms.length - 10} more
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
