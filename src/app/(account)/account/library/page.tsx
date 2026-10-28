import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/formatters";
import { buildMetadata } from "@/lib/seo";
import { listUserLibrary } from "@/server/queries/account";
import { getCurrentUser } from "@/server/current-user";
import { GraduationCap, Library, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({ title: "My Library" });

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/account/library");

  const { courses, videos } = await listUserLibrary(user.id);
  const empty = courses.length === 0 && videos.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader title="My Library" description="Everything you own, ready to watch." />

      {empty ? (
        <EmptyState
          icon={<Library />}
          title="Your library is empty"
          description="Courses and videos you buy will appear here."
        />
      ) : (
        <div className="space-y-8">
          {courses.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Courses</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {courses.map((c) => (
                  <Link key={c.purchaseId} href={`/courses/${c.slug}`}>
                    <Card className="transition-colors hover:border-primary/40">
                      <CardContent className="flex items-center gap-3 py-4">
                        <GraduationCap className="size-5 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{c.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Added {formatDate(c.grantedAt)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {videos.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Videos</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {videos.map((v) => (
                  <Link key={v.purchaseId} href={`/video/${v.slug}`}>
                    <Card className="transition-colors hover:border-primary/40">
                      <CardContent className="flex items-center gap-3 py-4">
                        <PlayCircle className="size-5 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{v.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {v.expiresAt
                              ? `Rental — expires ${formatDate(v.expiresAt)}`
                              : `Added ${formatDate(v.grantedAt)}`}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
