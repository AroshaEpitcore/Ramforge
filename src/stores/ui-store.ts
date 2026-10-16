"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  /** Admin sidebar collapsed state (persisted). */
  adminSidebarCollapsed: boolean;
  toggleAdminSidebar: () => void;
  setAdminSidebarCollapsed: (collapsed: boolean) => void;
  /** Command palette open state (session only). */
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      adminSidebarCollapsed: false,
      toggleAdminSidebar: () =>
        set((state) => ({ adminSidebarCollapsed: !state.adminSidebarCollapsed })),
      setAdminSidebarCollapsed: (collapsed) => set({ adminSidebarCollapsed: collapsed }),
      commandOpen: false,
      setCommandOpen: (open) => set({ commandOpen: open }),
    }),
    {
      name: "ramforge-ui",
      // Only persist the sidebar preference, not transient open states.
      partialize: (state) => ({ adminSidebarCollapsed: state.adminSidebarCollapsed }),
    },
  ),
);
