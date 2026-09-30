import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { InlinePhoto } from "@/components/ui/inline-photo";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { RegistrationForm } from "@/components/travel-consultant/registration-form";
import { consultantProgramme } from "@/lib/constants";
import { getBankDetails, getRegistrationFee } from "@/server/modules/consultants/consultants.service";

export const metadata: Metadata = {
  title: "Become a travel consultant",
  description:
    "A 4-week practical training on Google Meet, every Friday at 7:00 PM from 9 October 2026, with a paid internship for qualified candidates.",
};

// The fee and bank details come from env vars, so this page must render per
// request rather than being frozen at build time.
export const dynamic = "force-dynamic";

// Copy below comes from the "Travel Consultant 1" flyer.
const facts = [
  "Four live sessions over one month",
  "Live on Google Meet, so you can join from anywhere",
  "A paid internship for qualified candidates",
];

const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

export default function TravelConsultantPage() {
  const fee = getRegistrationFee();
  const details = [
    { label: "Schedule", value: consultantProgramme.scheduleLabel },
    { label: "Starts", value: consultantProgramme.startLabel },
    { label: "Venue", value: consultantProgramme.venue },
    { label: "Fee", value: naira.format(fee) },
  ];

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <Container className="relative">
        <ScrollReveal className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h1 className="text-4xl font-semibold leading-[1.02] tracking-tight text-text-primary sm:text-5xl md:text-6xl">
              Become a <InlinePhoto src="/images/travel-tours.jpg" alt="Friends on a beach" /> travel{" "}
              <span className="text-green-700">consultant.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-text-secondary">
              Learn how the travel business really works, from the people who do it every day. Four live sessions. One
              month. A real path into the industry.
            </p>

            <dl className="mt-10 grid max-w-md grid-cols-2 gap-x-6 gap-y-5 border-t border-border-primary pt-8">
              {details.map((item) => (
                <div key={item.label}>
                  <dt className="text-sm text-text-secondary">{item.label}</dt>
                  <dd className="mt-1 text-base font-medium text-text-primary">{item.value}</dd>
                </div>
              ))}
            </dl>

            <ul className="mt-10 max-w-md space-y-4 border-t border-border-primary pt-8">
              {facts.map((item) => (
                <li key={item} className="flex items-start gap-3 text-base leading-relaxed text-text-primary">
                  <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-700">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-3"
                      aria-hidden
                    >
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-8 text-sm text-text-secondary">
              Questions? Call or WhatsApp{" "}
              <a
                href={`https://wa.me/${consultantProgramme.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer noopener"
                className="font-medium text-green-700 underline underline-offset-4 hover:text-green-800"
              >
                {consultantProgramme.whatsapp.replace(/^\+234/, "0")}
              </a>
              .
            </p>
          </div>

          <RegistrationForm fee={fee} bankDetails={getBankDetails()} />
        </ScrollReveal>
      </Container>
    </section>
  );
}
