"use client";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { Banner } from "@/types";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setSelected(api.selectedScrollSnap());
    const onSelect = () => setSelected(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Lightweight autoplay (pauses on reduced-motion via the global CSS rule only
  // affecting CSS, so we also guard here).
  useEffect(() => {
    if (!api) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    const id = setInterval(() => api.scrollNext(), 6000);
    return () => clearInterval(id);
  }, [api]);

  return (
    <Carousel setApi={setApi} opts={{ loop: true }} className="overflow-hidden rounded-2xl">
      <CarouselContent>
        {banners.map((banner, i) => (
          <CarouselItem key={banner.id}>
            <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[21/9]">
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
              <div className="absolute inset-0 flex flex-col justify-center gap-3 p-6 sm:p-10 lg:max-w-xl">
                {banner.eyebrow && (
                  <span className="w-fit rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary ring-1 ring-primary/30">
                    {banner.eyebrow}
                  </span>
                )}
                <h1 className="text-3xl font-bold leading-tight text-white drop-shadow sm:text-5xl">
                  {banner.title}
                </h1>
                {banner.subtitle && (
                  <p className="max-w-md text-sm text-white/80 sm:text-base">{banner.subtitle}</p>
                )}
                {banner.ctaHref && (
                  <div className="mt-2">
                    <Button asChild size="lg" rightIcon={<ArrowRight />}>
                      <Link href={banner.ctaHref}>{banner.ctaLabel ?? "Explore"}</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className="left-3 border-white/20 bg-black/40 text-white hover:bg-black/60 hover:text-white" />
      <CarouselNext className="right-3 border-white/20 bg-black/40 text-white hover:bg-black/60 hover:text-white" />

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => api?.scrollTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === selected ? "w-6 bg-primary" : "w-1.5 bg-white/50 hover:bg-white/80",
            )}
          />
        ))}
      </div>
    </Carousel>
  );
}
