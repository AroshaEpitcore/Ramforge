import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/** Centered max-width content wrapper with responsive horizontal padding. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", className)} {...props} />
  );
}
