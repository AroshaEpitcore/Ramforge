import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Distraction-free player shell. Forced dark regardless of theme for a
 * cinematic viewing surface.
 */
export default function WatchLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark flex min-h-dvh flex-col bg-black text-white">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-white/10 px-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-white/80 hover:bg-white/10 hover:text-white"
          leftIcon={<ArrowLeft />}
        >
          <Link href="/account/library">Back to library</Link>
        </Button>
        <div className="ml-auto">
          <Logo showWordmark={false} />
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
