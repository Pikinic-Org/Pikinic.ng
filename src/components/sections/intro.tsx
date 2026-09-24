import { Container } from "@/components/ui/container";
import { InlinePhoto } from "@/components/ui/inline-photo";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function Intro() {
  return (
    <section className="py-24 md:py-40">
      <Container>
        <ScrollReveal>
          <p className="font-heading text-4xl font-medium leading-[1.12] tracking-tight text-text-primary sm:text-5xl md:text-6xl lg:text-7xl">
            From the first application <InlinePhoto src="/images/study-abroad.jpg" alt="University courtyard" />{" "}
            to the flight out <InlinePhoto src="/images/travel-tours.jpg" alt="Friends on a beach" /> and a place
            to land <InlinePhoto src="/images/stay-ride.jpg" alt="Short-stay apartment" />,{" "}
            <span className="text-text-tertiary">
              PiKiNiC handles every part of your journey. No agent fees, and you always know what&rsquo;s happening.
            </span>
          </p>
        </ScrollReveal>
      </Container>
    </section>
  );
}
