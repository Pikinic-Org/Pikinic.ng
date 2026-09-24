"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// The last line of the headline cycles through what we help people reach,
// one per service.
const outcomes = ["destination.", "degree.", "new home.", "fresh start."];

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // The brand fonts swap in after first paint and change the hero's height,
      // which would leave every ScrollTrigger below (the services panels) pinning
      // at stale positions. Re-measure once they're ready.
      document.fonts.ready.then(() => ScrollTrigger.refresh());

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Headline reveals line by line from behind each line's mask.
        gsap.from("[data-hero-line]", {
          yPercent: 110,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.12,
          delay: 0.1,
        });

        // Then the last word flips through the outcomes on a loop.
        const words = gsap.utils.toArray<HTMLElement>("[data-hero-word]");
        gsap.set(words.slice(1), { y: 0, yPercent: 110 });
        const cycle = gsap.timeline({ repeat: -1, delay: 2 });
        words.forEach((word, i) => {
          const next = words[(i + 1) % words.length];
          cycle
            .to(word, { yPercent: -110, duration: 0.7, ease: "expo.inOut" }, "+=1.6")
            .fromTo(next, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: "expo.inOut" }, "<");
        });

        gsap.from("[data-hero-fade]", {
          opacity: 0,
          y: 16,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          delay: 0.45,
        });

        // The framed image opens to full bleed, then keeps pushing in slightly
        // before the stage releases into the next section.
        gsap
          .timeline({
            scrollTrigger: {
              trigger: stage.current,
              start: "top top",
              end: "+=130%",
              pin: true,
              scrub: 0.6,
            },
          })
          .fromTo(
            frame.current,
            { clipPath: "inset(6% 5% 6% 5% round 12px)" },
            { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.inOut", duration: 0.75 }
          )
          .fromTo(image.current, { scale: 1.1 }, { scale: 1, ease: "power2.inOut", duration: 0.75 }, 0)
          .to(image.current, { scale: 1.05, ease: "none", duration: 0.25 });
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative text-text-primary">
      <Container className="relative pb-10 pt-14 md:pb-14 md:pt-20">
        <h1
          aria-label={`We handle the journey. You enjoy the ${outcomes[0]}`}
          className="text-[clamp(2.5rem,5.5vw,5.75rem)] font-semibold leading-[0.98] tracking-tight"
        >
          <span aria-hidden className="block overflow-hidden pb-[0.08em]">
            <span data-hero-line className="block">
              We handle the journey.
            </span>
          </span>
          <span aria-hidden className="block overflow-hidden pb-[0.08em]">
            <span data-hero-line className="block">
              You enjoy the
            </span>
          </span>
          <span aria-hidden className="block overflow-hidden pb-[0.08em]">
            <span data-hero-line className="grid text-green-700">
              {outcomes.map((word, i) => (
                <span
                  key={word}
                  data-hero-word
                  // Only the first word shows before GSAP takes over (and under reduced motion).
                  className={`col-start-1 row-start-1 whitespace-nowrap ${i > 0 ? "[transform:translateY(110%)]" : ""}`}
                >
                  {word}
                </span>
              ))}
            </span>
          </span>
        </h1>

        <div
          data-hero-fade
          className="mt-8 flex max-w-sm flex-col gap-6 md:absolute md:bottom-14 md:right-10 md:mt-0 lg:right-16"
        >
          <p className="text-base leading-relaxed text-text-secondary sm:text-lg">
            Flights, a place to stay, study abroad or your next big move. PiKiNiC is the team behind
            every part of your journey.
          </p>
          <Button href="/contact" size="lg">
            Start your journey
          </Button>
        </div>
      </Container>

      <div ref={stage} className="relative h-[62svh] overflow-hidden md:h-svh">
        <div
          ref={frame}
          className="absolute inset-0 overflow-hidden [clip-path:inset(6%_5%_6%_5%_round_12px)] motion-reduce:[clip-path:inset(4%_4%_4%_4%_round_12px)]"
        >
          <div ref={image} className="absolute inset-0 origin-top scale-[1.1] will-change-transform motion-reduce:scale-100">
            <Image
              src="/images/hero-blue.png"
              alt="A smiling traveller with a suitcase and passport walking through an airport terminal at sunset"
              fill
              priority
              quality={90}
              // On phones the frame is taller than the photo's proportions, so
              // the cover crop zooms in; ask for the full-resolution source.
              sizes="(max-width: 767px) 250vw, 100vw"
              className="object-cover object-[70%_8%]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
