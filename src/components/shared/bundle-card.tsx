import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { discountPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Bundle } from "@/types";
import { Layers } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function BundleCard({ bundle, className }: { bundle: Bundle; className?: string }) {
  const effectivePrice = bundle.salePrice ?? bundle.price;
  const savePercent = discountPercent(bundle.valuePrice, effectivePrice);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20",
        className,
      )}
    >
      <Link href={`/bundles/${bundle.slug}`} className="relative block aspect-video overflow-hidden">
        <Image
          src={bundle.thumbnailUrl}
          alt={bundle.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute left-2 top-2 flex gap-1">
          <Badge className="gap-1">
            <Layers className="size-3" />
            {bundle.videoCount} videos
          </Badge>
        </div>
        {savePercent > 0 && (
          <div className="absolute right-2 top-2">
            <Badge variant="sale">Save {savePercent}%</Badge>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold leading-snug">
          <Link href={`/bundles/${bundle.slug}`} className="line-clamp-1 after:absolute after:inset-0">
            {bundle.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{bundle.description}</p>
        <div className="mt-auto pt-2">
          <Price price={bundle.valuePrice} salePrice={effectivePrice} size="md" />
        </div>
      </div>
    </article>
  );
}
