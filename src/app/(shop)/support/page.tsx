import { Container } from "@/components/layout/container";
import { DonationWidget } from "@/features/support/components/donation-widget";
import { formatCurrency } from "@/lib/formatters";
import { buildMetadata } from "@/lib/seo";
import { getDonationStats, listRecentDonations } from "@/server/queries/donations";
import { formatDistanceToNow } from "date-fns";
import { Coffee, Heart } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Support us",
  description:
    "Enjoying FrameForge? Buy us a coffee — a one-time tip that helps us make more free VFX and compositing lessons.",
});

// Reads live donation data (supporters wall + stats).
export const dynamic = "force-dynamic";

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ thanks?: string }>;
}) {
  const { thanks } = await searchParams;
  const [stats, supporters] = await Promise.all([getDonationStats(), listRecentDonations()]);

  return (
    <Container className="py-10">
      {thanks && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
          <Heart className="size-5 shrink-0 text-primary" />
          <p className="text-sm">
            <span className="font-semibold">Thank you so much!</span> Your support means the world
            and helps us keep making lessons. ☕
          </p>
        </div>
      )}

      <header className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          Support FrameForge
        </p>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
          Buy us a coffee <Coffee className="size-7 text-primary" />
        </h1>
        <p className="text-lg text-muted-foreground">
          FrameForge is built to make VFX education accessible. If our tutorials have helped you, a
          small one-time tip keeps new lessons coming — no account required.
        </p>
        {stats.supporterCount > 0 && (
          <p className="text-sm text-muted-foreground">
            Joined by <span className="font-semibold text-foreground">{stats.supporterCount}</span>{" "}
            {stats.supporterCount === 1 ? "supporter" : "supporters"} so far. Thank you! 💛
          </p>
        )}
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* Supporters wall */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Recent supporters</h2>
          {supporters.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No supporters yet — be the first to buy us a coffee!
            </div>
          ) : (
            <ul className="space-y-3">
              {supporters.map((s) => (
                <li key={s.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2 font-medium">
                      <Coffee className="size-4 shrink-0 text-primary" />
                      <span className="truncate">{s.name}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">
                      {formatCurrency(s.amount)}
                    </span>
                  </div>
                  {s.message && <p className="mt-2 text-sm text-muted-foreground">“{s.message}”</p>}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(s.at), { addSuffix: true })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Donation widget */}
        <aside className="lg:sticky lg:top-20">
          <DonationWidget />
        </aside>
      </div>
    </Container>
  );
}
