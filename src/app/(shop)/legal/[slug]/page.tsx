import { Container } from "@/components/layout/container";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const LEGAL: Record<string, { title: string; summary: string }> = {
  privacy: {
    title: "Privacy Policy",
    summary: "How we collect, use and protect your personal data.",
  },
  cookies: {
    title: "Cookie Policy",
    summary: "The cookies we use and how to manage your preferences.",
  },
  terms: { title: "Terms of Service", summary: "The terms governing your use of Ramforge." },
  "refund-policy": {
    title: "Refund Policy",
    summary: "Refund rules for digital products and the cancellation waiver.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = LEGAL[slug];
  return buildMetadata({ title: doc?.title ?? "Legal" });
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = LEGAL[slug];
  if (!doc) notFound();

  return (
    <Container className="max-w-3xl py-10">
      <article className="prose-sm space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">{doc.title}</h1>
        <p className="text-muted-foreground">{doc.summary}</p>
        <p className="text-sm text-muted-foreground">
          This is a scaffold placeholder. The full legal copy is added during the SEO &amp; legal
          phase. Last updated: scaffold.
        </p>
      </article>
    </Container>
  );
}
