"use client";

import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "ramforge-cookie-consent";

/**
 * GDPR-style cookie consent banner. Persists the choice in localStorage.
 * Non-essential tracking should check this value before loading.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable (private mode) — keep hidden.
    }
  }, []);

  const decide = (choice: "accepted" | "rejected") => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
          role="dialog"
          aria-label="Cookie consent"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-xl border bg-card p-4 shadow-lg sm:flex sm:items-center sm:gap-4"
        >
          <p className="text-sm text-muted-foreground">
            We use cookies to improve your experience and analyse traffic. See our{" "}
            <Link href="/legal/cookies" className="font-medium text-primary underline-offset-4 hover:underline">
              Cookie Policy
            </Link>
            .
          </p>
          <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
            <Button variant="outline" size="sm" onClick={() => decide("rejected")}>
              Reject
            </Button>
            <Button size="sm" onClick={() => decide("accepted")}>
              Accept
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
