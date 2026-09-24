import { Container } from "@/components/ui/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { testimonials } from "@/lib/constants";

function initials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);
}

export function Testimonials() {
  return (
    <section className="py-20 md:py-28">
      <Container>
        <ScrollReveal>
          <div className="max-w-xl">
            <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight text-text-primary sm:text-5xl">
              Real people, real journeys
            </h2>
            <p className="mt-4 text-base leading-relaxed text-text-secondary md:text-lg">
              Trust, in their own words.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="flex flex-col justify-between gap-10 rounded-2xl bg-surface-primary p-6 md:p-8"
              >
                <blockquote className="text-lg leading-relaxed text-text-primary">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <figcaption className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-900 text-sm font-medium text-neutral-0">
                    {initials(t.name)}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-text-primary">{t.name}</div>
                    <div className="mt-0.5 text-sm text-text-secondary">{t.context}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
