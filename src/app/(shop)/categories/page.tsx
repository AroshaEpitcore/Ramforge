import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCategoryIcon } from "@/lib/category-icons";
import { buildMetadata } from "@/lib/seo";
import { listStorefrontCategories } from "@/server/queries/categories";
import { FolderTree } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = buildMetadata({
  title: "Categories",
  description: "Explore videos by category and skill.",
});

export default async function CategoriesPage() {
  const categories = await listStorefrontCategories();

  return (
    <Container className="py-8">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Browse categories</h1>
        <p className="text-sm text-muted-foreground">Find the right tutorials for your craft.</p>
      </div>
      {categories.length === 0 ? (
        <EmptyState
          icon={<FolderTree />}
          title="No categories yet"
          description="Categories you create in the admin will appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.icon);
            return (
              <Link key={category.id} href={`/shop?category=${category.slug}`}>
                <Card className="h-full gap-3 p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-primary/15 text-primary [&_svg]:size-5">
                    <Icon />
                  </div>
                  <div>
                    <h2 className="font-semibold">{category.name}</h2>
                    {category.description && (
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    )}
                  </div>
                  <p className="mt-auto text-xs font-medium text-muted-foreground">
                    {category.videoCount} video{category.videoCount === 1 ? "" : "s"}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
