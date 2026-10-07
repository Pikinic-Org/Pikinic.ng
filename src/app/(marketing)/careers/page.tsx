import type { Metadata } from "next";
import Link from "next/link";
import { CareersCta } from "@/components/careers/careers-cta";
import { CategoryFilter } from "@/components/careers/category-filter";
import { JobRow } from "@/components/careers/job-row";
import { Container } from "@/components/ui/container";
import { InlinePhoto } from "@/components/ui/inline-photo";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { jobCategories } from "@/lib/constants";
import { categoryFromSlug, categorySlug } from "@/lib/jobs";
import { listOpenJobs } from "@/server/modules/jobs/jobs.service";

export const metadata: Metadata = {
  title: "Careers",
  description: "Open roles at Pikinic across study abroad, travel and tours, stay and ride, and finance.",
};

export default async function CareersPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category: categoryParam } = await searchParams;
  const openJobs = await listOpenJobs();

  // Only offer filters that have something behind them, and ignore an unknown ?category=.
  const categories = jobCategories.filter((category) => openJobs.some((job) => job.category === category));
  const selected = categoryFromSlug(categoryParam);
  const jobs = selected ? openJobs.filter((job) => job.category === selected) : openJobs;

  return (
    <>
      <section className="pb-16 pt-24 md:pb-24 md:pt-32 lg:pt-40">
        <Container>
          <ScrollReveal>
            <h1 className="max-w-6xl text-5xl font-semibold leading-[1.05] tracking-tight text-text-primary sm:text-6xl md:text-7xl lg:text-8xl">
              Help people <InlinePhoto src="/images/travel-tours.jpg" alt="Friends travelling together" /> go{" "}
              <span className="text-green-700">places.</span>
            </h1>
            <p className="mt-10 max-w-2xl text-lg leading-relaxed text-text-secondary md:ml-auto md:text-xl">
              Pikinic makes travel, study abroad, and stays and rides simpler for the people who trust us with them.
              If you want to do that work with us, these are the roles open right now.
            </p>
          </ScrollReveal>
        </Container>
      </section>

      <section className="pb-20 md:pb-28">
        <Container>
          <ScrollReveal>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight text-text-primary sm:text-5xl">
                Open roles <span className="text-text-tertiary">({jobs.length})</span>
              </h2>
              {categories.length > 1 && (
                <CategoryFilter
                  options={categories.map((category) => ({ label: category, value: categorySlug(category) }))}
                  value={selected ? categorySlug(selected) : ""}
                />
              )}
            </div>

            {jobs.length === 0 ? (
              <div className="mt-10 flex min-h-56 flex-col justify-between gap-8 rounded-2xl bg-surface-primary p-6 md:p-10">
                <p className="text-2xl font-semibold tracking-tight text-text-primary">
                  {selected ? `No open ${selected} roles right now.` : "No open roles right now."}
                </p>
                <p className="max-w-md text-base leading-relaxed text-text-secondary">
                  {selected ? (
                    <>
                      See{" "}
                      <Link href="/careers" className="font-medium text-green-700 underline underline-offset-4">
                        all open roles
                      </Link>
                      , or check back soon.
                    </>
                  ) : (
                    "New roles are posted here as they open, so check back soon."
                  )}
                </p>
              </div>
            ) : (
              <ul className="mt-10 space-y-4">
                {jobs.map((job) => (
                  <JobRow key={job.id} job={job} />
                ))}
              </ul>
            )}
          </ScrollReveal>
        </Container>
      </section>

      <CareersCta />
    </>
  );
}
