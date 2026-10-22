import { Container } from "@/components/layout/container";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { ContactForm } from "@/features/contact/components/contact-form";
import { buildMetadata } from "@/lib/seo";
import { Mail, MessageSquare } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: "Get in touch with the FrameForge team.",
});

export default function ContactPage() {
  return (
    <Container className="max-w-3xl py-10">
      <div className="mb-6 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Contact us</h1>
        <p className="text-muted-foreground">
          Questions about a purchase or your account? Send us a message.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Mail className="size-4 text-primary" /> {siteConfig.supportEmail}
        </span>
        <span className="inline-flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" /> Live chat, Mon–Fri
        </span>
      </div>

      <Card>
        <CardContent>
          <ContactForm />
        </CardContent>
      </Card>
    </Container>
  );
}
