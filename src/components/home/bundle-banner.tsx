import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import type { Bundle } from "@/types";
import { ArrowRight, Layers } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/**
 * Wide promo banner for bundles: a full-width branded strip of bundle tiles,
 * each with a single "More details" button that opens its bundle page.
 */
export function BundleBanner({ bundles }: { bundles: Bundle[] }) {
  if (bundles.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border bg-gradient-to-r from-primary/10 via-card to-card">
      <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Layers className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Save with bundles</h2>
        </div>
        <Link href="/bundles" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto px-5 pb-5 sm:px-6">
        {bundles.map((b) => {
          const price = b.salePrice ?? b.price;
          return (
            <article
              key={b.id}
              className="flex w-64 shrink-0 flex-col overflow-hidden rounded-xl border bg-card"
            >
              <div className="relative aspect-video w-full">
                {b.thumbnailUrl ? (
                  <Image
                    src={b.thumbnailUrl}
                    alt={b.title}
                    fill
                    sizes="256px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/25 to-background">
                    <Layers className="size-8 text-primary/70" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <h3 className="line-clamp-1 font-semibold">{b.title}</h3>
                <Price price={b.valuePrice} salePrice={price} size="sm" />
                <Button asChild size="sm" className="mt-auto" rightIcon={<ArrowRight />}>
                  <Link href={`/bundles/${b.slug}`}>More details</Link>
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
