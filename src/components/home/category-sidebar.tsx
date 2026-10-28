"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getCategoryIcon } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";
import Link from "next/link";

/**
 * Left category rail (home/shop). Top-level categories with sub-categories act
 * as a single-open accordion; categories without children are plain links.
 */
export function CategorySidebar({
  categories,
  activeSlug,
  className,
}: {
  categories: Category[];
  activeSlug?: string;
  className?: string;
}) {
  if (categories.length === 0) return null;

  // Open the category that matches the active slug, else the first one.
  const defaultOpen =
    categories.find(
      (c) => c.slug === activeSlug || c.children?.some((ch) => ch.slug === activeSlug),
    )?.id ?? categories[0]?.id;

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen}
      className={cn("w-full", className)}
    >
      {categories.map((category) => {
        const Icon = getCategoryIcon(category.icon);
        const hasChildren = Boolean(category.children?.length);
        const active =
          category.slug === activeSlug || category.children?.some((c) => c.slug === activeSlug);

        const head = (
          <span className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-md [&_svg]:size-4",
                active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              <Icon />
            </span>
            <span
              className={cn(
                "truncate text-sm font-semibold tracking-wide uppercase",
                active ? "text-primary" : "text-foreground",
              )}
            >
              {category.name}
            </span>
          </span>
        );

        if (!hasChildren) {
          return (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="flex items-center gap-2.5 border-b py-3 transition-colors last:border-b-0 hover:text-primary"
            >
              {head}
            </Link>
          );
        }

        return (
          <AccordionItem key={category.id} value={category.id}>
            <AccordionTrigger className="gap-2 py-3 hover:no-underline">{head}</AccordionTrigger>
            <AccordionContent className="pb-2">
              <ul className="space-y-0.5 pl-10">
                {category.children!.map((child: Category) => (
                  <li key={child.id}>
                    <Link
                      href={`/shop?category=${child.slug}`}
                      className={cn(
                        "block rounded-md px-2 py-1.5 text-sm transition-colors",
                        child.slug === activeSlug
                          ? "font-medium text-primary"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                      )}
                    >
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
