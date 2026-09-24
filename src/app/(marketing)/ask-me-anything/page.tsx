import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { AmaForm } from "@/components/ask-me-anything/ama-form";

export const metadata: Metadata = {
  title: "Ask Me Anything: Study Abroad Live",
  description:
    "Submit your Study Abroad question and get it answered live by Mr Adeniyi in a 90-minute Ask Me Anything session.",
};

export default function AskMeAnythingPage() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">

      <Container className="relative max-w-xl">
        <ScrollReveal>
          <AmaForm />
        </ScrollReveal>
      </Container>
    </section>
  );
}
