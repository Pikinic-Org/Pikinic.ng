import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PathwayMark } from "@/components/ui/pathway-mark";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { SocialIcon } from "@/components/ui/social-icon";
import { ConsultantForm } from "@/components/travel-consultancy/consultant-form";
import { getRegistrationFee } from "@/server/modules/consultants/consultants.service";

export const metadata: Metadata = {
  title: "Travel Consultancy",
  description: "Students: become a Pikinic travel consultant and earn by helping people travel with confidence.",
};

// The fee comes from an env var, so this page must render per request rather
// than being frozen at build time.
export const dynamic = "force-dynamic";

const squareFramePath =
  "M0.25 0.25H1281.25M640.75 0.25V578.25M640.75 0.25H480.625M640.75 0.25H800.875M640.75 578.25H480.625M640.75 578.25H800.875M961 0.25V578.25M961 0.25H800.875M961 0.25H1121.12M961 578.25H800.875M961 578.25H1121.12M320.5 0.25V578.25M320.5 0.25H480.625M320.5 0.25H160.375M320.5 578.25H480.625M320.5 578.25H160.375M0.25 289.25H1281.25M0.25 289.25V144.75M0.25 289.25V433.75M1281.25 289.25V144.75M1281.25 289.25V433.75M1281.25 144.75V0.25H1121.12M1281.25 144.75H0.25M0.25 144.75V0.25H160.375M0.25 433.75V578.25H160.375M0.25 433.75H1281.25M1281.25 433.75V578.25H1121.12M480.625 0.25V578.25M800.875 0.25V578.25M1121.12 0.25V578.25M160.375 0.25V578.25";

const perks = [
  "Learn how flights, visas and travel packages really work",
  "Earn by referring travellers to Pikinic",
  "Build a practical, CV-ready career skill while you study",
  "Get support and training from the Pikinic team",
];

export default function TravelConsultancyPage() {
  const fee = getRegistrationFee();
  const whatsappGroupUrl = process.env.CONSULTANCY_WHATSAPP_GROUP_URL;

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <svg
        className="pointer-events-none absolute left-1/2 top-0 w-[90%] -translate-x-1/2 text-neutral-300/60"
        viewBox="0 0 1282 579"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={squareFramePath} stroke="currentColor" strokeWidth="0.5" />
      </svg>
      <PathwayMark className="pointer-events-none absolute -right-24 -top-16 hidden h-[380px] w-[380px] text-green-600/[0.1] lg:block" />

      <Container className="relative">
        <ScrollReveal className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h1 className="text-4xl font-bold uppercase leading-[0.95] tracking-tight text-text-primary sm:text-5xl md:text-6xl">
              Become a <span className="text-green-700">travel consultant.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-text-secondary">
              A programme for students who want to turn a love of travel into real skills and real income.
              Register, pay the one-time fee, and our team takes it from there.
            </p>

            <ul className="mt-12 space-y-4 border-t border-border-primary pt-8">
              {perks.map((perk) => (
                <li key={perk} className="flex items-start gap-3 text-base text-text-primary">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-1 h-4 w-4 shrink-0 text-green-700"
                  >
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                  {perk}
                </li>
              ))}
            </ul>

            {whatsappGroupUrl && (
              <div className="mt-10 border-t border-border-primary pt-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
                  For more enquiries
                </p>
                <a
                  href={whatsappGroupUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group mt-4 flex items-center gap-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] border border-border-primary text-text-secondary transition-colors group-hover:border-green-600 group-hover:text-green-700">
                    <SocialIcon icon="whatsapp" className="h-4 w-4" />
                  </span>
                  <span className="text-base font-semibold text-text-primary transition-colors group-hover:text-green-700">
                    Join our WhatsApp group
                  </span>
                </a>
              </div>
            )}
          </div>

          <ConsultantForm fee={fee} />
        </ScrollReveal>
      </Container>
    </section>
  );
}
