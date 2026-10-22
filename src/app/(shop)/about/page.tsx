import { Container } from "@/components/layout/container";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description:
    "FrameForge — making professional VFX and compositing education accessible to Sinhala-speaking learners.",
});

export default function AboutPage() {
  return (
    <Container className="max-w-3xl py-10">
      <div className="space-y-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          Learn. Create. Composite.
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">About FrameForge</h1>
        <p className="text-lg text-muted-foreground">
          Welcome to FrameForge — Where Creativity Meets Compositing.
        </p>
        <p className="text-muted-foreground">
          FrameForge is a dedicated learning platform created to make professional VFX and
          compositing education accessible to Sinhala-speaking learners. Our mission is to help
          aspiring artists understand the art of visual effects through clear explanations,
          practical demonstrations, and step-by-step tutorials in Sinhala.
        </p>
        <p className="text-muted-foreground">
          We believe that language should never be a barrier to creativity. FrameForge aims to make
          complex visual effects concepts easier to understand, helping learners develop their
          skills, explore their creativity, and build confidence in their artistic journey.
        </p>
      </div>

      <section className="mt-10 space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Our Mission</h2>
        <p className="text-muted-foreground">
          To make professional VFX and compositing education accessible to everyone through
          Sinhala-medium learning, practical demonstrations, and easy-to-understand tutorials.
        </p>
        <p className="text-muted-foreground">
          We aim to create an environment where beginners and aspiring artists can learn at their
          own pace, strengthen their technical knowledge, and turn their creative ideas into
          compelling visual stories.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Why FrameForge?</h2>
        <p className="text-muted-foreground">
          At FrameForge, we believe that every great artist begins with curiosity, dedication, and a
          willingness to learn.
        </p>
        <p className="text-muted-foreground">
          Our approach focuses on simplifying complex concepts, encouraging hands-on practice, and
          making the learning experience more engaging and accessible. We want to help build a
          community where Sinhala-speaking artists can develop their abilities and pursue their
          ambitions in the world of visual effects and filmmaking.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Our Vision</h2>
        <p className="text-muted-foreground">
          Our vision is to build a creative learning community that inspires the next generation of
          VFX artists. We want to make professional knowledge more accessible, encourage creative
          experimentation, and help learners take confident steps towards their goals in the visual
          effects industry.
        </p>
      </section>

      <section className="mt-10 space-y-3 rounded-2xl border bg-gradient-to-b from-card to-card/60 p-6">
        <h2 className="text-2xl font-semibold tracking-tight">Start Your Creative Journey</h2>
        <p className="text-muted-foreground">
          Every professional artist starts somewhere. With patience, practice, and passion, you can
          transform your imagination into powerful visual experiences.
        </p>
        <p className="text-muted-foreground">
          FrameForge is here to support your journey, one lesson and one composite at a time.
        </p>
      </section>
    </Container>
  );
}
