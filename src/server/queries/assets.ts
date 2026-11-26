import "server-only";

import { db } from "@/server/db";

export interface PublicAsset {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  /** Where the "Download" button points — external link or uploaded file. */
  href: string;
  /** True when the link leaves the site (opens in a new tab). */
  external: boolean;
}

/** Published assets for the public /assets page, in display order. */
export async function listPublishedAssets(): Promise<PublicAsset[]> {
  const rows = await db.asset.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
  });
  return rows
    .map((a) => {
      const external = !!a.externalUrl;
      const href = a.externalUrl || a.fileUrl || "";
      return {
        id: a.id,
        title: a.title,
        slug: a.slug,
        description: a.description,
        thumbnailUrl: a.thumbnailUrl,
        href,
        external,
      };
    })
    .filter((a) => a.href.length > 0);
}

export interface AdminAssetRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  externalUrl: string | null;
  fileUrl: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  position: number;
}

/** All assets (any status) for the admin manager, in display order. */
export async function listAssetsForAdmin(): Promise<AdminAssetRow[]> {
  const rows = await db.asset.findMany({ orderBy: [{ position: "asc" }, { createdAt: "desc" }] });
  return rows.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    description: a.description,
    thumbnailUrl: a.thumbnailUrl,
    externalUrl: a.externalUrl,
    fileUrl: a.fileUrl,
    status: a.status,
    position: a.position,
  }));
}
