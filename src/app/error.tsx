"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to your error-tracking service here.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="max-w-md text-muted-foreground">
          An unexpected error occurred. You can try again, or head back home.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground">Ref: {error.digest}</p>
        )}
      </div>
      <Button onClick={reset} leftIcon={<RotateCcw />}>
        Try again
      </Button>
    </div>
  );
}
