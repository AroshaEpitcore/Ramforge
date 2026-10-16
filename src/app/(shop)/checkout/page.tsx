import { Container } from "@/components/layout/container";
import { PlaceholderPage } from "@/components/shared/placeholder";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { buildMetadata } from "@/lib/seo";
import { Info } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "Checkout" });

export default function CheckoutPage() {
  return (
    <Container className="max-w-2xl py-8">
      <PlaceholderPage
        title="Checkout"
        description="Stripe payment (cards, Apple Pay, Google Pay), VAT for digital goods and coupons are wired in here."
        note="Payment flows are not implemented in the scaffold. The structure below shows the legally-required cancellation waiver for immediate digital access."
      >
        <Alert variant="info">
          <Info />
          <AlertTitle>Digital goods — right to cancel</AlertTitle>
          <AlertDescription>
            By starting to watch immediately you waive your statutory right to cancel. This consent
            and its timestamp are stored on the order.
          </AlertDescription>
        </Alert>
        <Label className="mt-4 items-start font-normal">
          <Checkbox className="mt-0.5" />
          <span className="text-sm text-muted-foreground">
            I agree that my video access begins immediately and I waive my 14-day right to cancel.
          </span>
        </Label>
      </PlaceholderPage>
    </Container>
  );
}
