"use client";

import { AdminBreadcrumbs } from "@/components/layout/admin-breadcrumbs";
import { AdminMobileSidebar } from "@/components/layout/admin-sidebar";
import { CommandPalette, type CommandGroupSpec } from "@/components/layout/command-palette";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { filterAdminNav } from "@/config/nav";
import { useUIStore } from "@/stores/ui-store";
import type { SessionUser } from "@/types";
import { Bell, Menu, Search } from "lucide-react";
import { useState } from "react";

function adminCommandGroups(role: SessionUser["role"]): CommandGroupSpec[] {
  return filterAdminNav({ role }).map((group) => ({
    heading: group.label,
    items: group.items.map((item) => ({ label: item.title, href: item.href, icon: item.icon })),
  }));
}

export function AdminTopbar({ user }: { user: SessionUser }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="size-5" />
      </Button>
      <AdminMobileSidebar role={user.role} open={mobileOpen} onOpenChange={setMobileOpen} />

      <div className="hidden md:block">
        <AdminBreadcrumbs />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="hidden h-9 items-center gap-2 rounded-full border border-input bg-muted/50 px-3.5 text-sm text-muted-foreground transition-colors hover:bg-muted sm:inline-flex"
        >
          <Search className="size-4" />
          <span>Search…</span>
          <Kbd>⌘K</Kbd>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-5" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex-col items-start gap-0.5">
              <span className="font-medium">New order #10482</span>
              <span className="text-xs text-muted-foreground">Nuke Compositing Pro Pack · $119.00</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex-col items-start gap-0.5">
              <span className="font-medium">Refund requested</span>
              <span className="text-xs text-muted-foreground">Order #10477 · review needed</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />
        <UserMenu user={user} />
      </div>

      <CommandPalette groups={adminCommandGroups(user.role)} />
    </header>
  );
}
