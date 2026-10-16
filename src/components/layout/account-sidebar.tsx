"use client";

import { accountNav } from "@/config/nav";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Customer account navigation. Vertical list on desktop; horizontally
 * scrollable tabs on mobile.
 */
export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="lg:w-56">
      {/* Mobile: horizontal tabs */}
      <ul className="flex gap-1 overflow-x-auto border-b pb-px lg:hidden">
        {accountNav.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {item.icon && <item.icon className="size-4" />}
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop: vertical list */}
      <ul className="hidden flex-col gap-1 lg:flex">
        {accountNav.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                {item.icon && <item.icon className="size-4" />}
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
