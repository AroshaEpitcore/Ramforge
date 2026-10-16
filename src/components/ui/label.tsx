"use client";

import { cn } from "@/lib/utils";
import * as LabelPrimitive from "@radix-ui/react-label";
import type { ComponentProps } from "react";

export function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex select-none items-center gap-2 text-sm font-medium leading-none",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70 group-data-[disabled=true]:opacity-70",
        className,
      )}
      {...props}
    />
  );
}
