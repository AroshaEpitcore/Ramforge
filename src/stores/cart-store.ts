"use client";

import type { CartLine } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartState {
  lines: CartLine[];
  addLine: (line: CartLine) => void;
  removeLine: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

/**
 * Client-side cart. Digital goods, so quantity is effectively 0/1 per line,
 * but we keep a quantity field for a consistent commerce model. No server
 * sync yet — wire to server actions later.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      addLine: (line) =>
        set((state) => {
          if (state.lines.some((l) => l.refId === line.refId && l.option === line.option)) {
            return state;
          }
          return { lines: [...state.lines, line] };
        }),
      removeLine: (id) => set((state) => ({ lines: state.lines.filter((l) => l.id !== id) })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            l.id === id ? { ...l, quantity: Math.max(1, quantity) } : l,
          ),
        })),
      clear: () => set({ lines: [] }),
    }),
    { name: "ramforge-cart" },
  ),
);

export const selectCartCount = (state: CartState) =>
  state.lines.reduce((sum, l) => sum + l.quantity, 0);

export const selectCartSubtotal = (state: CartState) =>
  state.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
