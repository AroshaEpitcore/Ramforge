import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentProps } from "react";

/** Brand mark — an orange "forge" spark with a play triangle. */
export function LogoMark({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("size-7", className)}
      {...props}
    >
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M12 9.5v13l10-6.5-10-6.5Z" className="fill-primary-foreground" />
    </svg>
  );
}

interface LogoProps extends Omit<ComponentProps<typeof Link>, "href"> {
  showWordmark?: boolean;
  markClassName?: string;
  href?: ComponentProps<typeof Link>["href"];
}

/** Full logo: mark + wordmark, linking home by default. */
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
        "inline-flex items-center gap-2 rounded-md font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    >
      <LogoMark className={markClassName} />
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight [font-family:var(--font-orbitron)]">
          Ram<span className="text-primary">forge</span>
        </span>
      )}
    </Link>
  );
}
