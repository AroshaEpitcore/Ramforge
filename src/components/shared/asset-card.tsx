import { Button } from "@/components/ui/button";
import type { PublicAsset } from "@/server/queries/assets";
import { Download, ExternalLink, Package } from "lucide-react";
import Link from "next/link";

/**
 * Public downloadable-asset card: thumbnail (or placeholder), title, optional
 * description, and a Download/Open button. External links open in a new tab.
 */
export function AssetCard({ asset }: { asset: PublicAsset }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {asset.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-provided URL of any host
          <img
            src={asset.thumbnailUrl}
            alt={asset.title}
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/25 to-background">
            <Package className="size-10 text-primary/60" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="leading-snug font-semibold">{asset.title}</h3>
        {asset.description && (
          <p className="line-clamp-3 text-sm text-muted-foreground">{asset.description}</p>
        )}
        <div className="mt-auto pt-2">
          <Button asChild fullWidth leftIcon={asset.external ? <ExternalLink /> : <Download />}>
            <Link
              href={asset.href}
              target={asset.external ? "_blank" : undefined}
              rel={asset.external ? "noopener noreferrer" : undefined}
            >
              {asset.external ? "Open" : "Download"}
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
