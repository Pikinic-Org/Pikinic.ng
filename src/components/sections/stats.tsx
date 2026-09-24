import { Container } from "@/components/ui/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { DeepGreenBackdrop } from "@/components/ui/brand-pattern";
import { StatCounter } from "@/components/sections/stat-counter";
import { stats } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Stats() {
  return (
    <section className="py-20 md:py-28">
      <Container>
        <ScrollReveal>
          <div className="max-w-xl">
            <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight text-text-primary sm:text-5xl">
              Performance you can measure
            </h2>
            <p className="mt-4 text-base leading-relaxed text-text-secondary md:text-lg">
              These numbers come from real bookings and real travellers, tracked closely so every
              trip we plan is measured against outcomes, not promises.
            </p>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "relative isolate flex flex-col justify-between gap-10 overflow-hidden rounded-2xl p-6 md:min-h-56 md:p-8",
                  stat.accent ? "bg-green-900 text-neutral-0" : "bg-surface-primary text-text-primary"
                )}
              >
                {stat.accent && <DeepGreenBackdrop />}
                <dt className={cn("text-sm", stat.accent ? "text-neutral-0/70" : "text-text-secondary")}>
                  {stat.label}
                </dt>
                <dd
                  className={cn(
                    "font-heading text-5xl font-semibold tracking-tight sm:text-6xl",
                    stat.accent && "text-green-500"
                  )}
                >
                  <StatCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </dd>
              </div>
            ))}
          </dl>
        </ScrollReveal>
      </Container>
    </section>
  );
}
