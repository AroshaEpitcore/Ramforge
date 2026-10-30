import "server-only";

import { db } from "@/server/db";
import type { Banner } from "@/types";

export interface AdminBannerRow {
  id: string;
  title: string;
  subtitle: string | null;
  eyebrow: string | null;
  imageUrl: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  position: number;
  active: boolean;
}

export async function listBannersForAdmin(): Promise<AdminBannerRow[]> {
  const rows = await db.banner.findMany({ orderBy: [{ position: "asc" }, { createdAt: "desc" }] });
  return rows.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    eyebrow: b.eyebrow,
    imageUrl: b.imageUrl,
    ctaLabel: b.ctaLabel,
    ctaHref: b.ctaHref,
    position: b.position,
    active: b.active,
  }));
}

export interface AdminEmailTemplateRow {
  id: string;
  key: string;
  name: string;
  subject: string;
  body: string;
  updatedAt: string;
}

export async function listEmailTemplatesForAdmin(): Promise<AdminEmailTemplateRow[]> {
  const rows = await db.emailTemplate.findMany({ orderBy: { name: "asc" } });
  return rows.map((t) => ({
    id: t.id,
    key: t.key,
    name: t.name,
    subject: t.subject,
    body: t.body,
    updatedAt: t.updatedAt.toISOString(),
  }));
}

/** Active banners for the storefront hero (ordered). */
export async function listActiveBanners(): Promise<Banner[]> {
  const rows = await db.banner.findMany({
    where: { active: true },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
  });
  return rows.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle ?? undefined,
    eyebrow: b.eyebrow ?? undefined,
    imageUrl: b.imageUrl,
    ctaLabel: b.ctaLabel ?? undefined,
    ctaHref: b.ctaHref ?? undefined,
    active: b.active,
  }));
}
