"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createDonationCheckout } from "@/features/support/actions";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Coffee } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const COFFEE_PRICE_MINOR = 500; // $5 per coffee
const PRESETS = [1, 3, 5]; // number of coffees

export function DonationWidget() {
  const [count, setCount] = useState<number>(1);
  const [custom, setCustom] = useState(""); // dollars, empty = use preset
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const customMinor = custom.trim() ? Math.round(Number(custom) * 100) : 0;
  const usingCustom = customMinor > 0;
  const amountMinor = usingCustom ? customMinor : count * COFFEE_PRICE_MINOR;
  const validAmount = Number.isFinite(amountMinor) && amountMinor >= 100;

  const onSupport = async () => {
    if (!validAmount) {
      toast.error("Enter an amount of at least $1");
      return;
    }
    setLoading(true);
    const res = await createDonationCheckout({
      amountMinor,
      supporterName: name.trim() || undefined,
      message: message.trim() || undefined,
    });
    if (!res.ok) {
      setLoading(false);
      toast.error("Could not start checkout", { description: res.error });
      return;
    }
    window.location.assign(res.data.url); // off to Stripe Checkout
  };

  return (
    <div className="rounded-2xl border bg-gradient-to-b from-card to-card/60 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Coffee className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Buy us a coffee</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        A one-time tip that helps us make more free lessons. No account needed.
      </p>

      {/* Coffee presets */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {PRESETS.map((n) => {
          const selected = !usingCustom && count === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => {
                setCount(n);
                setCustom("");
              }}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-3 text-sm transition-colors",
                selected ? "border-primary bg-primary/10 text-foreground" : "hover:bg-accent/50",
              )}
            >
              <span className="flex" aria-hidden>
                {Array.from({ length: n }).map((_, i) => (
                  <Coffee key={i} className="size-4 text-primary" />
                ))}
              </span>
              <span className="font-medium tabular-nums">
                {formatCurrency(n * COFFEE_PRICE_MINOR)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom amount */}
      <div className="mt-3 grid gap-1.5">
        <Label htmlFor="custom-amount" className="text-xs text-muted-foreground">
          Or enter a custom amount ($)
        </Label>
        <Input
          id="custom-amount"
          type="number"
          min="1"
          step="1"
          inputMode="decimal"
          placeholder="e.g. 20"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
      </div>

      {/* Supporter details */}
      <div className="mt-3 grid gap-1.5">
        <Label htmlFor="supporter-name" className="text-xs text-muted-foreground">
          Your name (optional)
        </Label>
        <Input
          id="supporter-name"
          placeholder="Jane"
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="mt-3 grid gap-1.5">
        <Label htmlFor="supporter-message" className="text-xs text-muted-foreground">
          Say something nice (optional)
        </Label>
        <Textarea
          id="supporter-message"
          rows={2}
          maxLength={280}
          placeholder="Love the tutorials!"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <Button
        fullWidth
        className="mt-4"
        loading={loading}
        disabled={!validAmount}
        onClick={onSupport}
      >
        Support {validAmount ? formatCurrency(amountMinor) : ""}
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Secure payment via Stripe · cards, Apple&nbsp;Pay &amp; Google&nbsp;Pay
      </p>
    </div>
  );
}
