import { BrandPattern } from "@/components/ui/brand-pattern";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function Cta() {
  return (
    <section className="px-3 pb-3 md:px-4 md:pb-4">
      <div className="relative isolate overflow-hidden rounded-2xl bg-green-900 py-24 text-neutral-0 md:py-36">
        <BrandPattern className="-z-10" />
        <Container className="flex flex-col items-center text-center">
          <ScrollReveal className="flex flex-col items-center">
            <h2 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
              Where do you want to <span className="text-green-500">go?</span>
            </h2>

            <p className="mt-6 max-w-md text-base leading-relaxed text-neutral-0/70 sm:text-lg">
              Tell us what you need and we&rsquo;ll point you in the right direction. No pressure.
              No fees. Just the right next step.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button href="/contact" size="lg">
                Contact us
              </Button>
              <Button
                href="https://travelsandtours.pikinic.ng"
                size="lg"
                variant="inverse"
              >
                Book a flight
              </Button>
            </div>
          </ScrollReveal>
        </Container>
      </div>
    </section>
  );
}
