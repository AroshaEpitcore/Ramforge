import { LibraryItem } from "@/components/shared/library-item";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { buildMetadata } from "@/lib/seo";
import { mockLibrary } from "@/mocks";
import { Library } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({ title: "My Library" });

export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="My Library" description="Everything you own or have rented, ready to watch." />
      {mockLibrary.length === 0 ? (
        <EmptyState
          icon={<Library />}
          title="Your library is empty"
          description="Videos you buy or rent will appear here."
        />
      ) : (
        <div className="space-y-3">
          {mockLibrary.map((entry) => (
            <LibraryItem key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
