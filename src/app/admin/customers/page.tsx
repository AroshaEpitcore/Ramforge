import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
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
import { listCustomers } from "@/server/queries/admin-ops";
import { getCurrentUser } from "@/server/current-user";
import { Users } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Customers" });

export default async function AdminCustomersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/customers");
  requirePermission(user, "customers:read");

  const customers = await listCustomers();

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Everyone with an account." />
      {customers.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No users yet"
          description="Accounts will appear here."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Owned</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email}</TableCell>
                  <TableCell>
                    <Badge variant={c.role === "CUSTOMER" ? "muted" : "secondary"}>{c.role}</Badge>
                  </TableCell>
                  <TableCell>{c.orderCount}</TableCell>
                  <TableCell>{c.purchaseCount}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
