import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
// Static import so the hero's intrinsic size is known and cache-busts on change.
import donateHero from "../../../public/donate/donate-hero.jpg";

export interface DonateCardProps {
  /** Lines of the headline; the last line is highlighted in Electric Orange. */
  headline?: [string, string, string];
  body?: string;
  ctaLabel?: string;
  href?: string;
  className?: string;
}

/**
 * Cinematic donation poster — mug-and-flaming-heart hero, bold uppercase
 * headline and a full-width Electric Orange CTA. Always renders on the brand's
 * dark surface regardless of the active theme, mirroring the design reference.
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
        "relative mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-3xl",
        "border border-[#ff7900]/30 bg-[#080a0d]",
        "shadow-[0_0_50px_-12px_rgba(255,121,0,0.45)]",
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
        {/* Blend the image into the card body. */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#080a0d]" />
      </div>

      <div className="relative -mt-6 flex flex-col gap-4 px-6 pb-6">
        <h3 className="font-display text-3xl leading-[0.95] font-extrabold tracking-tight text-white uppercase">
          {line1}
          <br />
          {line2}
          <br />
          <span className="text-[#ff7900]">{highlight}</span>
        </h3>

        <p className="text-sm leading-relaxed text-white/70">{body}</p>

        <Link
          href={href}
          className={cn(
            "mt-1 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5",
            "bg-gradient-to-b from-[#ff9a42] to-[#ff7900] text-lg font-extrabold tracking-wider text-[#080a0d] uppercase",
            "shadow-[0_8px_24px_-6px_rgba(255,121,0,0.6)] transition hover:brightness-110",
            "outline-none focus-visible:ring-2 focus-visible:ring-[#ff9a42] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080a0d]",
          )}
        >
          <Heart className="size-5 fill-current" />
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
