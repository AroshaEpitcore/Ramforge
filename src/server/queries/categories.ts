import "server-only";

import { db } from "@/server/db";
import type { Category } from "@/types";

function publishedWhere(now = new Date()) {
  return {
    status: "PUBLISHED" as const,
    OR: [{ publishAt: null }, { publishAt: { lte: now } }],
  };
}

/**
 * Storefront category tree: top-level categories (each with its sub-categories)
 * and a count of published videos. Used by the category rail, the /categories
 * page and the mobile chips.
 */
export async function listStorefrontCategories(): Promise<Category[]> {
  const [cats, counts] = await Promise.all([
    db.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, description: true, icon: true, parentId: true },
    }),
    db.video.groupBy({
      by: ["categoryId"],
      where: publishedWhere(),
      _count: { _all: true },
    }),
  ]);

  const directCount = new Map(counts.map((c) => [c.categoryId, c._count._all]));

  const toView = (c: (typeof cats)[number], children: Category[] = []): Category => {
    const childTotal = children.reduce((n, ch) => n + (ch.videoCount ?? 0), 0);
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? undefined,
      icon: c.icon ?? undefined,
      parentId: c.parentId,
      children: children.length ? children : undefined,
      videoCount: (directCount.get(c.id) ?? 0) + childTotal,
    };
  };

  const childrenOf = (parentId: string) =>
    cats.filter((c) => c.parentId === parentId).map((c) => toView(c));

  return cats.filter((c) => !c.parentId).map((c) => toView(c, childrenOf(c.id)));
}
