import { DeepGreenBackdrop } from "@/components/ui/brand-pattern";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

// Same inset deep-green block as the site-wide call-to-action, worded for careers.
export function CareersCta() {
  return (
    <section className="px-3 pb-3 md:px-4 md:pb-4">
      <div className="relative isolate overflow-hidden rounded-2xl bg-green-900 py-24 text-neutral-0 md:py-36">
        <DeepGreenBackdrop />
        <Container className="flex flex-col items-center text-center">
          <ScrollReveal className="flex flex-col items-center">
            <h2 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
              Don&rsquo;t see your <span className="text-green-500">role?</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-neutral-0/70 sm:text-lg">
              Tell us what you do best and how you&rsquo;d like to help. We&rsquo;ll keep you in mind as new roles
              open.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button href="/contact" size="lg">
                Contact us
              </Button>
            </div>
          </ScrollReveal>
        </Container>
      </div>
    </section>
  );
}
