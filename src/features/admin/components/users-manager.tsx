"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateUserRole } from "@/features/admin/user-actions";
import type { AdminCustomerRow } from "@/server/queries/admin-ops";
import type { Role } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const ROLES: Role[] = [
  "SUPER_ADMIN",
  "STORE_MANAGER",
  "CONTENT_UPLOADER",
  "SUPPORT_STAFF",
  "CUSTOMER",
];
const LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  STORE_MANAGER: "Store Manager",
  CONTENT_UPLOADER: "Content Uploader",
  SUPPORT_STAFF: "Support Staff",
  CUSTOMER: "Customer",
};

export function UsersManager({
  users,
  currentUserId,
}: {
  users: AdminCustomerRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const change = async (userId: string, role: Role) => {
    setBusy(userId);
    const res = await updateUserRole({ userId, role });
    setBusy(null);
    if (!res.ok) {
      toast.error("Could not change role", { description: res.error });
      router.refresh(); // revert the select to the server value
    } else {
      toast.success("Role updated");
      router.refresh();
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="w-56">Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name}</TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell>
                <Select
                  value={u.role}
                  disabled={u.id === currentUserId || busy === u.id}
                  onValueChange={(v) => change(u.id, v as Role)}
                >
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
