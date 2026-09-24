"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { services, type Service } from "@/lib/constants";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// White text only where it passes contrast (blue); the lighter accents take dark text.
const accentClasses: Record<Service["accent"], { panel: string; muted: string; button: string }> = {
  blue: {
    panel: "bg-blue-500 text-neutral-0",
    muted: "text-neutral-0/80",
    button: "bg-neutral-0 text-neutral-900 hover:bg-neutral-100",
  },
  orange: {
    panel: "bg-orange-500 text-neutral-900",
    muted: "text-neutral-900/75",
    button: "bg-neutral-900 text-neutral-0 hover:bg-neutral-800",
  },
  yellow: {
    panel: "bg-yellow-500 text-neutral-900",
    muted: "text-neutral-900/75",
    button: "bg-neutral-900 text-neutral-0 hover:bg-neutral-800",
  },
  red: {
    panel: "bg-red-500 text-neutral-900",
    muted: "text-neutral-900/75",
    button: "bg-neutral-900 text-neutral-0 hover:bg-neutral-800",
  },
};

const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function Services() {
  const root = useRef<HTMLDivElement>(null);

  // Pinned panels with overscroll, after GSAP's "Slides Pinning - Overscroll"
  // demo: each panel pins once its bottom meets the viewport's, then shrinks and
  // fades while the next panel slides over it. The last panel scrolls normally.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const panels = gsap.utils.toArray<HTMLElement>("[data-service-panel]");
        panels.pop();

        panels.forEach((panel) => {
          gsap
            .timeline({
              scrollTrigger: {
                trigger: panel,
                start: "bottom bottom",
                end: "bottom top",
                pin: true,
                pinSpacing: false,
                scrub: true,
              },
            })
            .fromTo(panel, { scale: 1, opacity: 1 }, { scale: 0.7, opacity: 0.5, duration: 0.9 })
            .to(panel, { opacity: 0, duration: 0.1 });
        });
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root} id="what-we-do">
      <Container className="pb-12 pt-20 md:pb-16 md:pt-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="text-5xl font-semibold leading-[1.02] tracking-tight text-text-primary sm:text-6xl md:text-7xl">
            What we do
          </h2>
          <p className="max-w-sm text-base leading-relaxed text-text-secondary md:text-lg">
            Four services, one team. Pick the part of the journey you need help with.
          </p>
        </div>
      </Container>

      <div className="flex flex-col gap-3 px-3 md:gap-0 md:px-0">
        {services.map((service) => {
          const accent = accentClasses[service.accent];
          return (
            <section
              key={service.name}
              id={slugify(service.name)}
              data-service-panel
              className={cn(
                "relative origin-center overflow-hidden rounded-2xl md:h-svh md:rounded-none",
                accent.panel
              )}
            >
              <Container className="grid h-full gap-8 py-10 md:grid-cols-[1.1fr_1fr] md:gap-12 md:py-16">
                <div className="flex flex-col justify-between gap-10">
                  <h3 className="text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-8xl">
                    {service.heading}
                  </h3>

                  <div className="flex max-w-md flex-col gap-6">
                    <p className={cn("text-lg leading-relaxed", accent.muted)}>{service.description}</p>
                    <Button href={service.href} size="lg" className={accent.button}>
                      Get started
                    </Button>
                  </div>
                </div>

                <div className="relative aspect-[4/3] overflow-hidden rounded-xl md:aspect-auto">
                  <Image
                    src={service.image.src}
                    alt={service.image.alt}
                    fill
                    sizes="(min-width: 768px) 45vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </Container>
            </section>
          );
        })}
      </div>
    </div>
  );
}
