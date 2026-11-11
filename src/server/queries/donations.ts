import "server-only";

import { db } from "@/server/db";

export interface SupporterEntry {
  id: string;
  name: string;
  message: string | null;
  amount: number;
  currency: string;
  at: string;
}

export interface DonationStats {
  supporterCount: number;
  totalAmount: number;
}

/** Recent paid donations for the public supporters wall (newest first). */
export async function listRecentDonations(limit = 15): Promise<SupporterEntry[]> {
  const rows = await db.donation.findMany({
    where: { status: "PAID" },
    orderBy: { paidAt: "desc" },
    take: limit,
    select: {
      id: true,
      supporterName: true,
      message: true,
      amount: true,
      currency: true,
      paidAt: true,
      createdAt: true,
    },
  });
  return rows.map((d) => ({
    id: d.id,
    name: d.supporterName?.trim() || "A kind supporter",
    message: d.message?.trim() || null,
    amount: d.amount,
    currency: d.currency,
    at: (d.paidAt ?? d.createdAt).toISOString(),
  }));
}

/** Totals for the "N supporters" headline. */
export async function getDonationStats(): Promise<DonationStats> {
  const agg = await db.donation.aggregate({
    where: { status: "PAID" },
    _count: { _all: true },
    _sum: { amount: true },
  });
  return {
    supporterCount: agg._count._all,
    totalAmount: agg._sum.amount ?? 0,
  };
}
