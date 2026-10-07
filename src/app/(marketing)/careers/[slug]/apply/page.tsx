import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationForm } from "@/components/careers/application-form";
import { JobFacts } from "@/components/careers/job-facts";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { formatClosingDate, isJobOpen } from "@/lib/jobs";
import { getPublishedJob } from "@/server/modules/jobs/jobs.service";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const job = await getPublishedJob(slug);
  if (!job) return { title: "Role not found" };
  return { title: `Apply: ${job.title}`, description: job.summary };
}

export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getPublishedJob(slug);
  if (!job) notFound();

  const isOpen = isJobOpen(job);

  return (
    <section className="pb-20 pt-24 md:pb-28 md:pt-32 lg:pt-40">
      <Container>
        <ScrollReveal className="mx-auto max-w-3xl">
          <Link
            href={`/careers/${job.slug}`}
            className="text-sm font-medium text-green-700 underline-offset-4 hover:underline"
          >
            &larr; Back to the role
          </Link>
          <h1 className="mt-8 text-4xl font-semibold leading-[1.05] tracking-tight text-text-primary sm:text-5xl md:text-6xl">
            Apply for <span className="text-green-700">{job.title}.</span>
          </h1>
          <JobFacts job={job} closed={!isOpen} className="mt-6" />

          <div className="mt-10 rounded-2xl bg-surface-primary p-6 md:p-10">
            {isOpen ? (
              <ApplicationForm slug={job.slug} />
            ) : (
              <div className="flex flex-col items-start gap-6">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
                    Applications are <span className="text-green-700">closed.</span>
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-text-secondary">
                    This role stopped taking applications on {formatClosingDate(job.closesAt)}.
                  </p>
                </div>
                <Button href="/careers" size="lg" variant="secondary">
                  See open roles
                </Button>
              </div>
            )}
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
