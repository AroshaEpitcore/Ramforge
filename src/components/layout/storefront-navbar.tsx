import { CartButton } from "@/components/layout/cart-button";
import { CommandPalette } from "@/components/layout/command-palette";
import { MainNavLinks } from "@/components/layout/main-nav-links";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchTrigger } from "@/components/layout/search-trigger";
import { UserMenu } from "@/components/layout/user-menu";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { listPublishedVideos } from "@/server/queries/videos";
import type { SessionUser } from "@/types";
import { Heart } from "lucide-react";
import Link from "next/link";

export async function StorefrontNavbar({ user }: { user: SessionUser | null }) {
  // Real search suggestions for the ⌘K palette (tolerate an unavailable DB).
  let searchVideos: { label: string; href: string; keywords?: string[] }[] = [];
  try {
    const videos = await listPublishedVideos();
    searchVideos = videos.slice(0, 8).map((v) => ({
      label: v.title,
      href: `/video/${v.slug}`,
      keywords: v.tags,
    }));
  } catch {
    searchVideos = [];
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 lg:gap-6">
          <MobileNav />
          <Logo />
          <MainNavLinks className="hidden lg:flex" />
        </div>

        <div className="ml-auto flex flex-1 items-center justify-end gap-1 sm:gap-2">
          <SearchTrigger className="mr-1 md:ml-auto" />
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
            aria-label="Favourites"
          >
            <Link href="/account/favourites">
              <Heart className="size-5" />
            </Link>
          </Button>
          <CartButton />
          <ThemeToggle />
          <div className="ml-1">
            <UserMenu user={user} />
          </div>
        </div>
      </div>
      <CommandPalette videos={searchVideos} />
    </header>
  );
}
