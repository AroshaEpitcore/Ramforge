import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";
import { PrintButton } from "@/features/account/components/print-button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { buildMetadata } from "@/lib/seo";
import { getUserOrderDetail } from "@/server/queries/account";
import { getCurrentUser } from "@/server/current-user";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Invoice" });

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=/account/orders/${id}/invoice`);

  const order = await getUserOrderDetail(user.id, id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/account/orders" className="text-sm text-muted-foreground hover:underline">
          ← Back to orders
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-lg border bg-card p-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">{siteConfig.name}</h1>
            <p className="text-sm text-muted-foreground">{siteConfig.supportEmail}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Invoice</p>
            <p className="text-muted-foreground">
              {order.invoiceNumber ?? `#${order.id.slice(0, 8)}`}
            </p>
            <p className="text-muted-foreground">{formatDate(order.date)}</p>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="mb-6 text-sm">
          <p className="text-muted-foreground">Billed to</p>
          <p className="font-medium">{order.customerEmail}</p>
          <p className="text-muted-foreground">Status: {order.status}</p>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2">Item</th>
              <th className="py-2">Type</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className="border-b">
                <td className="py-2">{item.title}</td>
                <td className="py-2 text-muted-foreground">{item.type}</td>
                <td className="py-2 text-right tabular-nums">{item.quantity}</td>
                <td className="py-2 text-right tabular-nums">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 ml-auto w-48 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatCurrency(order.subtotal)}</span>
          </div>
          {order.taxTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT</span>
              <span className="tabular-nums">{formatCurrency(order.taxTotal)}</span>
            </div>
          )}
          <Separator className="my-1" />
          <div className="flex justify-between font-semibold">
            <span>Total ({order.currency})</span>
            <span className="tabular-nums">{formatCurrency(order.total)}</span>
          </div>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Digital goods — the customer agreed access begins immediately, waiving the 14-day right to
          cancel. Thank you for your purchase.
        </p>
      </div>
    </div>
  );
}
