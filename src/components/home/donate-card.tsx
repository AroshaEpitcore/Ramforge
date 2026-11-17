import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
// Static import so the poster's intrinsic size is known and it cache-busts on change.
import donatePoster from "../../../public/donate-image.jpg";

export interface DonateCardProps {
  ctaLabel?: string;
  href?: string;
  className?: string;
  /** Admin-set poster URL; falls back to the bundled image when absent. */
  imageSrc?: string | null;
}

/**
 * Donation poster. The headline and artwork are baked into the image, so the
 * card simply shows the full poster with a prominent DONATE button anchored at
 * the bottom. The poster is editable from Admin → Settings (`imageSrc`), falling
 * back to the bundled default. Uses the site's design tokens, so the surface
 * follows the active light/dark theme like every other card.
 */
export function DonateCard({
  ctaLabel = "Donate",
  href = "/support",
  className,
  imageSrc,
}: DonateCardProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border bg-card shadow-lg",
        className,
      )}
    >
      {/* 4:5 portrait frame; admin images of other ratios are cover-cropped. */}
      <div className="relative aspect-[4/5] w-full">
        <Image
          src={imageSrc || donatePoster}
          alt="Learned something new? Support FrameForge."
          fill
          sizes="(max-width: 1024px) 100vw, 320px"
          className="object-cover"
          priority
        />
      </div>

      {/* Button anchored over the foot of the poster. */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-16">
        <Button
          asChild
          size="lg"
          fullWidth
          leftIcon={<Heart className="fill-current" />}
          className="rounded-full font-semibold tracking-wider uppercase"
        >
          <Link href={href}>{ctaLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
