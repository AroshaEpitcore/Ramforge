import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/types";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function BlogList({ posts, className }: { posts: BlogPost[]; className?: string }) {
  return (
    <ul className={cn("divide-y rounded-xl border bg-card", className)}>
      {posts.map((post) => (
        <li key={post.id}>
          <Link
            href={`/blog/${post.slug}`}
            className="group flex items-center gap-3 p-3 transition-colors hover:bg-accent/40"
          >
            <div className="relative aspect-square size-14 shrink-0 overflow-hidden rounded-md">
              <Image src={post.thumbnailUrl} alt={post.title} fill sizes="56px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium leading-snug">{post.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(post.publishedAt)}</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
