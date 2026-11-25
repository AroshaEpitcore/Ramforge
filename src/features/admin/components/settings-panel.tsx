"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  exportNewsletterCsv,
  setDonateImage,
  setPaymentsEnabled,
  setSnowEnabled,
  setVatRate,
  setVideoBanner,
} from "@/features/admin/actions";
import { ImageUploadField } from "@/features/admin/components/image-upload-field";
import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function SettingsPanel({
  paymentsEnabled,
  vatRate,
  donateImageUrl,
  videoBanner,
  snowEnabled,
}: {
  paymentsEnabled: boolean;
  vatRate: number;
  donateImageUrl: string | null;
  videoBanner: { imageUrl: string; href: string } | null;
  snowEnabled: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(paymentsEnabled);
  const [saving, startSaving] = useTransition();
  const [snow, setSnow] = useState(snowEnabled);
  const [savingSnow, startSnow] = useTransition();
  const [exporting, setExporting] = useState(false);
  const [vat, setVat] = useState(vatRate);
  const [savingVat, setSavingVat] = useState(false);
  const [donateImg, setDonateImg] = useState(donateImageUrl ?? "");
  const [savingDonate, setSavingDonate] = useState(false);
  const [vbImage, setVbImage] = useState(videoBanner?.imageUrl ?? "");
  const [vbHref, setVbHref] = useState(videoBanner?.href ?? "");
  const [savingVb, setSavingVb] = useState(false);

  const saveDonate = async (next: string) => {
    setDonateImg(next); // reflect immediately
    setSavingDonate(true);
    const res = await setDonateImage(next);
    setSavingDonate(false);
    if (!res.ok) toast.error("Could not save", { description: res.error });
    else {
      toast.success(next ? "Donate image updated" : "Reverted to default image");
      router.refresh();
    }
  };

  const saveVideoBanner = async (image: string, link: string) => {
    setSavingVb(true);
    const res = await setVideoBanner(image, link);
    setSavingVb(false);
    if (!res.ok) toast.error("Could not save", { description: res.error });
    else {
      toast.success(image ? "Video banner saved" : "Video banner removed");
      router.refresh();
    }
  };

  const saveVat = async () => {
    setSavingVat(true);
    const res = await setVatRate(vat);
    setSavingVat(false);
    if (!res.ok) toast.error("Could not save", { description: res.error });
    else {
      toast.success("VAT rate saved");
      router.refresh();
    }
  };

  const toggleSnow = (next: boolean) => {
    setSnow(next); // optimistic
    startSnow(async () => {
      const res = await setSnowEnabled(next);
      if (!res.ok) {
        setSnow(!next);
        toast.error("Could not update", { description: res.error });
      } else {
        toast.success(next ? "Snow turned on" : "Snow turned off");
        router.refresh();
      }
    });
  };

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
          <CardTitle>Festive snow</CardTitle>
          <CardDescription>
            Show a light snowfall effect across the storefront. Great for the holidays; turn it off
            any time. It never shows in the admin area.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label className="flex items-center gap-3 font-normal">
            <Switch checked={snow} onCheckedChange={toggleSnow} disabled={savingSnow} />
            Snowfall enabled
          </Label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>VAT / sales tax</CardTitle>
          <CardDescription>
            A flat tax rate added at checkout (0 = no tax). For location-based tax, enable Stripe
            Tax.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-end gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="vat">Rate (%)</Label>
            <Input
              id="vat"
              type="number"
              min="0"
              max="100"
              step="0.5"
              className="w-28"
              value={vat}
              onChange={(e) => setVat(e.target.valueAsNumber || 0)}
            />
          </div>
          <Button onClick={saveVat} loading={savingVat}>
            Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Donate card image</CardTitle>
          <CardDescription>
            The poster shown in the homepage donate card. Upload to replace it, or remove your
            upload to go back to the built-in image.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploadField
            value={donateImg}
            onChange={saveDonate}
            folder="donate"
            label="Poster"
            allowUrl={false}
            previewClassName="h-56"
            hint="Use a tall portrait image — 4:5 works best (e.g. 1080×1350 px). Any headline text should be baked into the artwork; the Donate button is added automatically."
          />
          {savingDonate && <p className="mt-2 text-xs text-muted-foreground">Saving…</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Video page banner</CardTitle>
          <CardDescription>
            A promo image shown in the sidebar of every video page (e.g. a bundle or an
            upcoming-tutorials teaser). Set where it links, then upload the image. Remove the image
            to hide the banner.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5">
            <Label htmlFor="vb-href">Link (where the banner goes when clicked)</Label>
            <Input
              id="vb-href"
              placeholder="/bundles/your-bundle"
              value={vbHref}
              onChange={(e) => setVbHref(e.target.value)}
              onBlur={() => vbImage && saveVideoBanner(vbImage, vbHref)}
            />
          </div>
          <ImageUploadField
            value={vbImage}
            onChange={(url) => {
              setVbImage(url);
              saveVideoBanner(url, vbHref);
            }}
            folder="promos"
            label="Banner image"
            allowUrl={false}
            previewClassName="h-40"
            hint="Any shape works; a portrait (e.g. 3:4) or square fits the sidebar best. Keep important text large."
          />
          {savingVb && <p className="text-xs text-muted-foreground">Saving…</p>}
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
