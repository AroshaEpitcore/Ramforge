"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ORDER_STATUS_LABELS } from "@/config/constants";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { AdminOrderRow } from "@/server/queries/admin-ops";
import type { OrderStatus } from "@/types";
import type { ColumnDef } from "@tanstack/react-table";

const statusVariant: Record<OrderStatus, "success" | "warning" | "destructive" | "muted"> = {
  PAID: "success",
  PENDING: "warning",
  FAILED: "destructive",
  REFUNDED: "muted",
  PARTIALLY_REFUNDED: "warning",
};

const columns: ColumnDef<AdminOrderRow>[] = [
  {
    accessorKey: "id",
    header: "Order",
    cell: ({ row }) => <span className="font-mono text-xs">#{row.original.id.slice(0, 8)}</span>,
  },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.customer}</span>
        <span className="text-xs text-muted-foreground">{row.original.email}</span>
      </div>
    ),
  },
  { accessorKey: "itemCount", header: "Items" },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => <span className="tabular-nums">{formatCurrency(row.original.total)}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status]}>
        {ORDER_STATUS_LABELS[row.original.status]}
      </Badge>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDate(row.original.date)}</span>
    ),
  },
];

export function OrdersTable({
  orders,
  pageSize = 10,
}: {
  orders: AdminOrderRow[];
  pageSize?: number;
}) {
  return (
    <DataTable
      columns={columns}
      data={orders}
      searchPlaceholder="Search orders…"
      pageSize={pageSize}
    />
  );
}
