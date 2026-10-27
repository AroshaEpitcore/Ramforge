"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { exportNewsletterCsv, setPaymentsEnabled } from "@/features/admin/actions";
import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function SettingsPanel({ paymentsEnabled }: { paymentsEnabled: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(paymentsEnabled);
  const [saving, startSaving] = useTransition();
  const [exporting, setExporting] = useState(false);

  const togglePayments = (next: boolean) => {
    setEnabled(next); // optimistic
    startSaving(async () => {
      const res = await setPaymentsEnabled(next);
      if (!res.ok) {
        setEnabled(!next);
        toast.error("Could not update", { description: res.error });
      } else {
        toast.success(next ? "Payments enabled" : "Payments disabled");
        router.refresh();
      }
    });
  };

  const exportCsv = async () => {
    setExporting(true);
    const res = await exportNewsletterCsv();
    setExporting(false);
    if (!res.ok) {
      toast.error("Export failed", { description: res.error });
      return;
    }
    const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Subscribers exported");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>
            While off, prices and buy buttons are hidden and paid items show “Coming soon”. Turn on
            to start selling courses (checkout arrives in the next phase).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label className="flex items-center gap-3 font-normal">
            <Switch checked={enabled} onCheckedChange={togglePayments} disabled={saving} />
            Payments enabled
          </Label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Newsletter</CardTitle>
          <CardDescription>Export the current subscriber list as a CSV file.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={exportCsv} loading={exporting} leftIcon={<Download />}>
            Export subscribers (CSV)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
