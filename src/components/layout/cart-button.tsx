"use client";

import { Button } from "@/components/ui/button";
import { selectCartCount, useCartStore } from "@/stores/cart-store";
import { ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

/** Cart trigger with an animated item-count badge. */
export function CartButton() {
  const count = useCartStore(selectCartCount);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Button asChild variant="ghost" size="icon" className="relative" aria-label={`Cart, ${count} items`}>
      <Link href="/cart">
        <ShoppingCart className="size-5" />
        <AnimatePresence>
          {mounted && count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="absolute -right-0.5 -top-0.5 flex size-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums"
            >
              {count > 9 ? "9+" : count}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    </Button>
  );
}
