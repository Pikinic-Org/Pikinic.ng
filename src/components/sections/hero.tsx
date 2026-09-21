import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PathwayMark } from "@/components/ui/pathway-mark";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden text-text-primary">
      <Container className="relative flex flex-col items-center pb-20 pt-16 text-center md:pb-28 md:pt-24">
        {/* brand pathway mark — extended into a backdrop behind the headline */}
        <PathwayMark
          className="float-slow pointer-events-none absolute left-1/2 top-0 z-0 h-[620px] w-[620px] -translate-x-1/2 text-green-600/[0.08]"
        />
        {/* square frame — brand grid backdrop, scoped to the container */}
        <svg
          className="pointer-events-none absolute left-1/2 top-0 z-0 w-[90%] -translate-x-1/2 text-neutral-300/60"
          viewBox="0 0 1282 579"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0.25 0.25H1281.25M640.75 0.25V578.25M640.75 0.25H480.625M640.75 0.25H800.875M640.75 578.25H480.625M640.75 578.25H800.875M961 0.25V578.25M961 0.25H800.875M961 0.25H1121.12M961 578.25H800.875M961 578.25H1121.12M320.5 0.25V578.25M320.5 0.25H480.625M320.5 0.25H160.375M320.5 578.25H480.625M320.5 578.25H160.375M0.25 289.25H1281.25M0.25 289.25V144.75M0.25 289.25V433.75M1281.25 289.25V144.75M1281.25 289.25V433.75M1281.25 144.75V0.25H1121.12M1281.25 144.75H0.25M0.25 144.75V0.25H160.375M0.25 433.75V578.25H160.375M0.25 433.75H1281.25M1281.25 433.75V578.25H1121.12M480.625 0.25V578.25M800.875 0.25V578.25M1121.12 0.25V578.25M160.375 0.25V578.25"
            stroke="currentColor"
            strokeWidth="0.5"
          />
        </svg>

        <h1 className="relative z-10 mt-7 w-full max-w-none text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="reveal block" style={{ animationDelay: "0.1s" }}>
            We handle the journey.
          </span>
          <span className="reveal block" style={{ animationDelay: "0.25s" }}>
            You enjoy the{" "}
            <span className="relative inline-block text-green-700">
              destination.
              <svg
                className="absolute -bottom-1 left-0 w-full sm:-bottom-2"
                viewBox="0 0 400 20"
                fill="none"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 14C60 6 140 4 200 8C260 12 340 14 398 6"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="draw-underline"
                  style={{ animationDelay: "0.9s" }}
                />
              </svg>
            </span>
          </span>
        </h1>

        <p
          className="reveal mt-6 max-w-3xl text-base text-text-secondary sm:text-lg"
          style={{ animationDelay: "0.4s" }}
        >
          Whether you&apos;re booking a flight, finding a place to stay,
          studying abroad, or
          <br className="hidden sm:block" /> planning your next move.
          PIKINIC is the team behind every part of your journey.
        </p>

        <div className="reveal mt-8 flex flex-wrap items-center justify-center gap-5" style={{ animationDelay: "0.5s" }}>
          <Button href="/contact" size="lg" variant="secondary">
            Start Your Journey
          </Button>
        </div>

        <div className="reveal mt-16 w-full" style={{ animationDelay: "0.65s" }}>
          <div className="scroll-close relative aspect-video w-full origin-bottom overflow-hidden rounded-[2px] border border-border-primary">
            <Image
              src="/images/hero.png"
              alt="A smiling traveller with a suitcase and passport walking through an airport terminal at sunset"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
