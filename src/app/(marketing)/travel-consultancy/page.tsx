import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { InlinePhoto } from "@/components/ui/inline-photo";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { SocialIcon } from "@/components/ui/social-icon";
import { ConsultantForm } from "@/components/travel-consultancy/consultant-form";
import { consultancyProgramme, directorContact } from "@/lib/constants";
import { getRegistrationFee } from "@/server/modules/consultants/consultants.service";

export const metadata: Metadata = {
  title: "Travel Consultancy",
  description: "Launch your career in travel consultancy. One-day training on Sat 10 Oct 2026 in Ikeja, Lagos, with a paid internship included at no additional cost.",
};

// The fee comes from an env var, so this page must render per request rather
// than being frozen at build time.
export const dynamic = "force-dynamic";

// Content below comes from the official training flyer.
const perks = [
  "Book flights and hotels",
  "Create profitable tour packages",
  "Guide clients through study-abroad applications",
  "Support visa application processes",
  "Attract clients and grow your travel business",
  "Earn money as a professional travel consultant",
];


export default function TravelConsultancyPage() {
  const fee = getRegistrationFee();
  const details = [
    { label: "Date", value: consultancyProgramme.dateLabel },
    { label: "Venue", value: consultancyProgramme.venue },
    { label: "Slots", value: consultancyProgramme.slotsLabel },
  ];
  const whatsappGroupUrl = process.env.CONSULTANCY_WHATSAPP_GROUP_URL;
  const whatsappHref = `https://wa.me/${directorContact.whatsapp.replace(/[^0-9]/g, "")}`;

  return (
    <section className="relative overflow-hidden py-24 md:py-32">

      <Container className="relative">
        <ScrollReveal className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h1 className="text-4xl font-semibold leading-[1.02] tracking-tight text-text-primary sm:text-5xl md:text-6xl">
              Launch your career <InlinePhoto src="/images/travel-tours.jpg" alt="Friends on a beach" /> in{" "}
              <span className="text-green-700">travel consultancy.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-text-secondary">
              Open to anyone, no experience needed. Register, pay the training fee, and learn how to build
              a travel business from scratch.
            </p>

            <div className="mt-8 rounded-xl bg-green-500/15 px-5 py-4">
              <p className="text-sm font-medium text-green-700">Bonus benefit</p>
              <p className="mt-1 text-base font-medium text-text-primary">
                Paid internship included at no additional cost.
              </p>
            </div>

            <dl className="mt-8 grid gap-5 sm:grid-cols-3">
              {details.map((item) => (
                <div key={item.label}>
                  <dt className="text-sm text-text-secondary">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-text-primary">{item.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-12 border-t border-border-primary pt-8 text-sm text-text-secondary">
              What you&rsquo;ll learn
            </p>
            <ul className="mt-4 space-y-4">
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

            <div className="mt-10 border-t border-border-primary pt-8">
              <p className="text-sm text-text-secondary">
                For more enquiries
              </p>
              <div className="mt-4 space-y-3">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex items-center gap-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-primary text-text-secondary transition-colors group-hover:border-green-600 group-hover:text-green-700">
                    <SocialIcon icon="whatsapp" className="h-4 w-4" />
                  </span>
                  <span className="text-base font-medium text-text-primary transition-colors group-hover:text-green-700">
                    {directorContact.whatsapp}
                  </span>
                </a>
                {whatsappGroupUrl && (
                  <a
                    href={whatsappGroupUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex items-center gap-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-primary text-text-secondary transition-colors group-hover:border-green-600 group-hover:text-green-700">
                      <SocialIcon icon="whatsapp" className="h-4 w-4" />
                    </span>
                    <span className="text-base font-medium text-text-primary transition-colors group-hover:text-green-700">
                      Join our WhatsApp group
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <ConsultantForm fee={fee} />
        </ScrollReveal>
      </Container>
    </section>
  );
}
