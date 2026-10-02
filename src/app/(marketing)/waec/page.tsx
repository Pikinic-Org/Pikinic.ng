import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { InlinePhoto } from "@/components/ui/inline-photo";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { GuideForm } from "@/components/waec-guide/guide-form";

export const metadata: Metadata = {
  title: "Which UK universities accept your WAEC?",
  description:
    "The PiKiNiC WAEC brochure shows which UK universities take WAEC results, which route each one offers, and what it costs, with tuition and deposits listed.",
};

// Source tag stored on the lead, so the admin table shows who came from this page.
const SOURCE = "waec-brochure";

const inside = [
  "UK universities that accept WAEC C6 English",
  "Whether you can go straight into Year 1, or need a foundation year first",
  "Tuition and deposit ranges for 2026/27",
  "Which universities are lower cost, and what to check before you apply",
];

export default async function WaecBrochurePage({ searchParams }: { searchParams: Promise<{ link?: string }> }) {
  const { link } = await searchParams;

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <Container className="relative">
        <ScrollReveal className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h1 className="text-4xl font-semibold leading-[1.02] tracking-tight text-text-primary sm:text-5xl md:text-6xl">
              Which UK <InlinePhoto src="/images/study-abroad.jpg" alt="A university building" /> universities accept
              your <span className="text-green-700">WAEC?</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-text-secondary">
              The PiKiNiC WAEC brochure shows which UK universities take WAEC results, which route each one offers, and
              what it costs.
            </p>

            <ul className="mt-10 max-w-md space-y-4 border-t border-border-primary pt-8">
              {inside.map((item) => (
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

            <p className="mt-8 text-sm text-text-secondary">50% off for event attendees: ₦5,000 instead of ₦10,000. Offer ends today.</p>
          </div>

          <div>
            {link === "expired" && (
              <p className="mb-6 rounded-lg bg-surface-primary p-4 text-sm leading-relaxed text-text-secondary">
                That download link has expired. Fill in the form again and we&rsquo;ll give you a fresh one.
              </p>
            )}
            <GuideForm source={SOURCE} variant="brochure" />
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
