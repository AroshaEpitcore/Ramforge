import { PageHeader } from "@/components/layout/page-header";
import { CategoryManager } from "@/features/admin/components/category-manager";
import { requirePermission } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";
import { listCategoriesForAdmin, listCategoryOptions } from "@/server/queries/admin";
import { getCurrentUser } from "@/server/current-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "Categories" });

export default async function AdminCategoriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/categories");
  requirePermission(user, "categories:manage");

  const [categories, parents] = await Promise.all([
    listCategoriesForAdmin(),
    listCategoryOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organise videos and courses into a category tree."
      />
      <CategoryManager categories={categories} parents={parents} />
    </div>
  );
}
