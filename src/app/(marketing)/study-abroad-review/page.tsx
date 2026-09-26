import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { InlinePhoto } from "@/components/ui/inline-photo";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { GuideForm } from "@/components/waec-guide/guide-form";
import { GUIDE_DEFAULT_SOURCE, GUIDE_SOURCE_PATTERN } from "@/lib/guide-options";

export const metadata: Metadata = {
  title: "Free study abroad review",
  description:
    "Tell us where you are and we'll message you on WhatsApp within 24 hours to plan your next step. A free study abroad review with Pikinic. Zero fees to students, always.",
};

const inside = [
  "A review of your degree, your goals and your options",
  "The countries, universities and intakes that fit you",
  "What to prepare, including your English test and proof of funds",
  "Scholarship and funding routes",
];

export default async function StudyAbroadReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ src?: string; link?: string }>;
}) {
  const { src, link } = await searchParams;
  const source = src && GUIDE_SOURCE_PATTERN.test(src) ? src.toLowerCase() : GUIDE_DEFAULT_SOURCE;

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <Container className="relative">
        <ScrollReveal className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h1 className="text-4xl font-semibold leading-[1.02] tracking-tight text-text-primary sm:text-5xl md:text-6xl">
              Your degree can take you <InlinePhoto src="/images/study-abroad.jpg" alt="A university building" />{" "}
              <span className="text-green-700">abroad.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-text-secondary">
              Tell us where you are, and we&rsquo;ll message you on WhatsApp within 24 hours to plan your next step.
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

            <p className="mt-8 text-sm text-text-secondary">Free. Zero fees to students, always.</p>
          </div>

          <div>
            {link === "expired" && (
              <p className="mb-6 rounded-lg bg-surface-primary p-4 text-sm leading-relaxed text-text-secondary">
                That download link has expired. Fill in the form again and we&rsquo;ll give you a fresh one.
              </p>
            )}
            <GuideForm source={source} />
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
