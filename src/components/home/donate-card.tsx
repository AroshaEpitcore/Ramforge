import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
// Static import so the hero's intrinsic size is known and cache-busts on change.
import donateHero from "../../../public/donate/donate-hero.jpg";

export interface DonateCardProps {
  /** Lines of the headline; the last line is highlighted in the brand accent. */
  headline?: [string, string, string];
  body?: string;
  ctaLabel?: string;
  href?: string;
  className?: string;
}

/**
 * Donation poster — mug-and-flaming-heart hero, bold uppercase headline and a
 * full-width primary CTA. Uses the site's design tokens, so it follows the
 * active light/dark theme like every other card.
 */
export function DonateCard({
  headline = ["Learned", "something", "valuable?"],
  body = "If this website helped you learn something valuable, you can show your support with a contribution — every bit keeps new tutorials coming.",
  ctaLabel = "Donate",
  href = "/donate",
  className,
}: DonateCardProps) {
  const [line1, line2, highlight] = headline;
  return (
    <div
      className={cn(
        "relative mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border bg-card shadow-lg",
        className,
      )}
    >
      {/* Hero — cropped to the mug scene (the baked-in text sits below the crop). */}
      <div className="relative aspect-[467/385] w-full">
        <Image
          src={donateHero}
          alt="A mug with a glowing heart of flames"
          fill
          sizes="384px"
          className="object-cover object-top"
          priority
        />
        {/* Blend the image into the card surface. */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-card" />
      </div>

      <div className="relative -mt-6 flex flex-col gap-4 px-6 pb-6">
        <h3 className="font-display text-3xl leading-[0.95] font-extrabold tracking-tight text-foreground uppercase">
          {line1}
          <br />
          {line2}
          <br />
          <span className="text-primary">{highlight}</span>
        </h3>

        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>

        <Button
          asChild
          size="lg"
          fullWidth
          leftIcon={<Heart className="fill-current" />}
          className="mt-1 rounded-full font-semibold tracking-wider uppercase"
        >
          <Link href={href}>{ctaLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
