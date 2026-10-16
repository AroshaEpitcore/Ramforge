import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { Home, Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-7xl font-bold tracking-tighter text-primary">404</p>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="max-w-md text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you
          back to the action.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild leftIcon={<Home />}>
          <Link href="/">Back home</Link>
        </Button>
        <Button asChild variant="outline" leftIcon={<Search />}>
          <Link href="/shop">Browse {siteConfig.name}</Link>
        </Button>
      </div>
    </div>
  );
}
