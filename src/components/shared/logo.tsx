import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import type { ComponentProps } from "react";
// Static imports so intrinsic width/height track the files automatically —
// re-exporting/resizing the PNGs updates the rendered ratio with no code change.
import wordmarkDark from "../../../public/brand/frameforge-wordmark-dark.png";
import wordmarkLight from "../../../public/brand/frameforge-wordmark-light.png";

/**
 * Brand mark — the angular FrameForge "F" with its signature orange accent bar.
 * The F body uses `currentColor` so it inverts with the theme (dark on light,
 * light on dark), matching the supplied mark artwork.
 */
export function LogoMark({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden className={cn("size-7", className)} {...props}>
      {/* Electric Orange accent bar */}
      <path d="M9.5 12.2 14.5 10.5 14.5 30.8 9.5 32.5Z" fill="#FF7900" />
      {/* Angular F body */}
      <path
        d="M15.5 8 33 8 28 14 22 14 22 17.5 30.5 17.5 26 23 22 23 22 31 15.5 33Z"
        fill="currentColor"
      />
    </svg>
  );
}

interface LogoProps extends Omit<ComponentProps<typeof Link>, "href"> {
  showWordmark?: boolean;
  markClassName?: string;
  href?: ComponentProps<typeof Link>["href"];
}

/**
 * Full logo. With the wordmark it renders the official FrameForge lockup image
 * (dark variant on light surfaces, light variant on dark). Without it, the
 * crisp SVG mark is used — ideal for collapsed/compact placements.
 */
export function Logo({
  showWordmark = true,
  className,
  markClassName,
  href = "/",
  ...props
}: LogoProps) {
  return (
    <Link
      href={href}
      aria-label={`${siteConfig.name} home`}
      className={cn(
        "inline-flex items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    >
      {showWordmark ? (
        <>
          {/* Light surfaces → dark wordmark */}
          <Image
            src={wordmarkDark}
            alt={siteConfig.name}
            priority
            className="h-7 w-auto dark:hidden"
          />
          {/* Dark surfaces → light wordmark */}
          <Image
            src={wordmarkLight}
            alt={siteConfig.name}
            priority
            className="hidden h-7 w-auto dark:block"
          />
        </>
      ) : (
        <LogoMark className={markClassName} />
      )}
    </Link>
  );
}
