import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export interface PromoCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  imageUrl: string;
  features?: string[];
  ctaLabel?: string;
  ctaHref?: string;
  donateLabel?: string;
  donateHref?: string;
  className?: string;
}

/** Vertical promo panel (mirrors the "Nuke Tools" promo in the reference). */
export function PromoCard({
  eyebrow,
  title,
  description,
  imageUrl,
  features = [],
  ctaLabel = "Browse",
  ctaHref = "#",
  donateLabel,
  donateHref,
  className,
}: PromoCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 overflow-hidden rounded-2xl border bg-gradient-to-b from-card to-card/60 p-5",
        className,
      )}
    >
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">{eyebrow}</p>
        )}
        <h3 className="mt-1 text-xl font-bold tracking-tight">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className="relative aspect-video overflow-hidden rounded-lg">
        <Image src={imageUrl} alt={title} fill sizes="320px" className="object-cover" />
      </div>

      {features.length > 0 && (
        <ul className="grid gap-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <span className="flex size-4 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Check className="size-3" />
              </span>
              {feature}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-col gap-2">
        <Button asChild rightIcon={<ArrowRight />}>
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
        {donateHref && (
          <Button asChild variant="outline" leftIcon={<Heart />}>
            <Link href={donateHref}>{donateLabel ?? "Donate"}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
