"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

/** Triggers the browser print dialog (for saving an invoice as PDF). */
export function PrintButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      leftIcon={<Printer />}
      onClick={() => window.print()}
      className="print:hidden"
    >
      Print / Save PDF
    </Button>
  );
}
