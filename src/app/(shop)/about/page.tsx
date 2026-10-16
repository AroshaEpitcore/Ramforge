import { Container } from "@/components/layout/container";
import { StatCard } from "@/components/ui/stat-card";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";
import { Clapperboard, Download, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description: `Learn more about ${siteConfig.name}.`,
});

export default function AboutPage() {
  return (
    <Container className="max-w-3xl py-10">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">About {siteConfig.name}</h1>
        <p className="text-lg text-muted-foreground">{siteConfig.description}</p>
        <p className="text-muted-foreground">
          Ramforge is a platform for learning VFX, compositing and filmmaking from industry
          professionals. Buy once and watch forever, or rent what you need — in stunning HD and 4K.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Videos" value="320+" icon={<Clapperboard />} />
        <StatCard label="Artists taught" value="48k" icon={<Users />} />
        <StatCard label="Hours of content" value="640" icon={<Download />} />
      </div>
    </Container>
  );
}
