import { DonateCard } from "@/components/home/donate-card";
import { Button } from "@/components/ui/button";
import type { Bundle } from "@/types";
import { ArrowRight, Layers } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const PINNED_BUNDLE_SLUG = "vfx-starter-bundle";

export interface SidebarPromoProps {
  /** Admin-set donate poster URL (falls back to the bundled image). */
  donateImageUrl: string | null;
  /** Admin-set promo banner; takes priority over the auto-featured bundle. */
  videoBanner: { imageUrl: string; href: string } | null;
  /** Published bundles — the first (pinned) is auto-featured when no banner. */
  bundles: Bundle[];
}

/**
 * Shared right-rail promo used on the video and course detail pages: the donate
 * card (poster + button) followed by either the admin-set promo banner or an
 * auto-featured bundle.
 */
export function SidebarPromo({ donateImageUrl, videoBanner, bundles }: SidebarPromoProps) {
  const featuredBundle = videoBanner
    ? null
    : (bundles.find((b) => b.slug === PINNED_BUNDLE_SLUG) ?? bundles[0] ?? null);

  return (
    <div className="space-y-3">
      {/* Always-on support prompt — same poster + button as the home page. */}
      <DonateCard href="/support" imageSrc={donateImageUrl} />

      {/* Promo slot: admin-set banner first, else auto-feature a bundle. */}
      {videoBanner ? (
        videoBanner.href ? (
          <Link
            href={videoBanner.href}
            className="block overflow-hidden rounded-xl border transition-opacity hover:opacity-95"
          >
            <Image
              src={videoBanner.imageUrl}
              alt="Promotion"
              width={0}
              height={0}
              sizes="360px"
              className="h-auto w-full"
            />
          </Link>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <Image
              src={videoBanner.imageUrl}
              alt="Promotion"
              width={0}
              height={0}
              sizes="360px"
              className="h-auto w-full"
            />
          </div>
        )
      ) : featuredBundle ? (
        <article className="overflow-hidden rounded-xl border bg-card">
          <Link
            href={`/bundles/${featuredBundle.slug}`}
            className="relative block aspect-video overflow-hidden"
          >
            {featuredBundle.thumbnailUrl ? (
              <Image
                src={featuredBundle.thumbnailUrl}
                alt={featuredBundle.title}
                fill
                sizes="360px"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/25 to-background">
                <Layers className="size-8 text-primary/70" />
              </div>
            )}
          </Link>
          <div className="flex flex-col gap-2 p-3">
            <span className="text-xs font-semibold text-primary">Bundle</span>
            <h3 className="line-clamp-1 leading-snug font-semibold">{featuredBundle.title}</h3>
            <Button asChild size="sm" rightIcon={<ArrowRight />}>
              <Link href={`/bundles/${featuredBundle.slug}`}>More details</Link>
            </Button>
          </div>
        </article>
      ) : null}
    </div>
  );
}
