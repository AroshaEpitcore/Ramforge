import { Container } from "@/components/layout/container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "FAQ",
  description: "Answers to common questions about buying and watching videos.",
});

const faqs = [
  {
    q: "How do I watch a video after buying?",
    a: "Purchased videos appear in My Library instantly. Click Watch to stream in our secure player, or Download if the video allows it.",
  },
  {
    q: "What's the difference between streaming, download and rental?",
    a: "Streaming lets you watch online anytime. Download gives you a file (subject to a download limit). Rental grants access for a set number of days.",
  },
  {
    q: "Can I get a refund on a digital video?",
    a: "Because videos are digital goods, you waive the right to cancel once you start watching. See our Refund Policy for the full details.",
  },
  {
    q: "What quality are the videos?",
    a: "Videos are available in HD and 4K where indicated by the quality badge on each video.",
  },
  {
    q: "How many devices can I watch on?",
    a: "You can stream on a limited number of devices at once to prevent account sharing.",
  },
];

export default function FaqPage() {
  return (
    <Container className="max-w-3xl py-10">
      <div className="mb-6 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h1>
        <p className="text-muted-foreground">Everything you need to know about Ramforge.</p>
      </div>
      <Accordion type="single" collapsible className="rounded-xl border px-4">
        {faqs.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent>{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Container>
  );
}
