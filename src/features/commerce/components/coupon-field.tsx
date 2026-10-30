"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { previewCoupon } from "@/features/commerce/actions";
import { formatCurrency } from "@/lib/formatters";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Coupon code input. On apply it previews the discount server-side and reports
 * the applied code + final price back to the parent via `onApplied`.
 */
export function CouponField({
  kind,
  itemId,
  onApplied,
}: {
  kind: "course" | "video" | "bundle";
  itemId: string;
  onApplied: (code: string | null, finalPrice: number | null) => void;
}) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    if (!code.trim()) return;
    setBusy(true);
    const res = await previewCoupon({ kind, id: itemId, code });
    setBusy(false);
    if (!res.ok) {
      toast.error("Invalid coupon", { description: res.error });
      return;
    }
    const normalised = code.trim().toUpperCase();
    setApplied(normalised);
    onApplied(normalised, res.data.finalPrice);
    toast.success(`Coupon applied — ${formatCurrency(res.data.discount)} off`);
  };

  const clear = () => {
    setApplied(null);
    setCode("");
    onApplied(null, null);
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm">
        <span>
          Coupon <span className="font-semibold">{applied}</span> applied
        </span>
        <button
          type="button"
          onClick={clear}
          aria-label="Remove coupon"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Coupon code"
        className="uppercase"
      />
      <Button
        type="button"
        variant="outline"
        onClick={apply}
        loading={busy}
        disabled={!code.trim()}
      >
        Apply
      </Button>
    </div>
  );
}
