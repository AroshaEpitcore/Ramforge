import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = buildMetadata({ title: "Order confirmed" });

export default function OrderConfirmationPage() {
  return (
    <Container className="max-w-xl py-16 text-center">
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckCircle2 className="size-8" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Thank you for your order!</h1>
      <p className="mt-2 text-muted-foreground">
        Your videos are ready to watch. We&apos;ve emailed your receipt and a &ldquo;Watch now&rdquo;
        link. (Scaffold placeholder — confirmation details render here.)
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button asChild>
          <Link href="/account/library">Go to My Library</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/shop">Keep browsing</Link>
        </Button>
      </div>
    </Container>
  );
}
