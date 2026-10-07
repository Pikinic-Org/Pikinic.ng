import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CareersCta } from "@/components/careers/careers-cta";
import { JobFacts } from "@/components/careers/job-facts";
import { JobRow } from "@/components/careers/job-row";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { formatClosingDate, isJobOpen } from "@/lib/jobs";
import { getPublishedJob, listOpenJobs } from "@/server/modules/jobs/jobs.service";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const job = await getPublishedJob(slug);
  if (!job) return { title: "Role not found" };
  return { title: job.title, description: job.summary };
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
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
  );
}

// 24px line icons in the same green circle as the About page's values.
const panelIcons = {
  about: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  duties: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="1.5" />
      <path d="M9 2.5h6v3H9zM8.5 11l1.5 1.5 3-3M8.5 16h7" />
    </>
  ),
  lookingFor: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.9-4.9M8 10.5l2 2 3.5-3.5" />
    </>
  ),
};

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: keyof typeof panelIcons;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface-primary p-6 md:p-10">
      <div className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-800">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-6"
          >
            {panelIcons[icon]}
          </svg>
        </span>
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">{title}</h2>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getPublishedJob(slug);
  if (!job) notFound();

  const isOpen = isJobOpen(job);
  const otherJobs = (await listOpenJobs()).filter((other) => other.id !== job.id).slice(0, 3);

  return (
    <>
      <section className="pb-16 pt-24 md:pb-20 md:pt-32 lg:pt-40">
        <Container>
          <ScrollReveal>
            <Link href="/careers" className="text-sm font-medium text-green-700 underline-offset-4 hover:underline">
              &larr; All roles
            </Link>
            <h1 className="mt-8 max-w-5xl text-5xl font-semibold leading-[1.05] tracking-tight text-text-primary sm:text-6xl md:text-7xl">
              {job.title}
            </h1>
            <JobFacts job={job} closed={!isOpen} className="mt-6 text-base" />
            <p className="mt-10 max-w-2xl text-lg leading-relaxed text-text-secondary md:ml-auto md:text-xl">
              {job.summary}
            </p>
          </ScrollReveal>
        </Container>
      </section>

      <section className="pb-20 md:pb-28">
        <Container>
          <ScrollReveal className="grid gap-4 md:grid-cols-[7fr_5fr] md:gap-6">
            <div className="space-y-4 md:space-y-6">
              <Panel title="About the role" icon="about">
                <p className="whitespace-pre-line text-base leading-relaxed text-text-secondary">{job.description}</p>
              </Panel>
              <Panel title="What you&rsquo;ll do" icon="duties">
                <Checklist items={job.responsibilities} />
              </Panel>
              <Panel title="What we&rsquo;re looking for" icon="lookingFor">
                <Checklist items={job.qualifications} />
              </Panel>
            </div>

            <aside className="flex flex-col gap-6 rounded-2xl bg-surface-primary p-6 md:sticky md:top-28 md:self-start md:p-10">
              {isOpen ? (
                <>
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
                      Interested?
                    </h2>
                    <p className="mt-3 text-base leading-relaxed text-text-secondary">
                      Applications close on {formatClosingDate(job.closesAt)}. You&rsquo;ll need your CV as a PDF
                      or Word file.
                    </p>
                  </div>
                  <Button href={`/careers/${job.slug}/apply`} size="lg">
                    Apply now
                  </Button>
                </>
              ) : (
                <>
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
                </>
              )}
            </aside>
          </ScrollReveal>
        </Container>
      </section>

      {otherJobs.length > 0 && (
        <section className="pb-20 md:pb-28">
          <Container>
            <ScrollReveal>
              <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight text-text-primary sm:text-5xl">
                Other open roles
              </h2>
              <ul className="mt-10 space-y-4">
                {otherJobs.map((other) => (
                  <JobRow key={other.id} job={other} />
                ))}
              </ul>
            </ScrollReveal>
          </Container>
        </section>
      )}

      <CareersCta />
    </>
  );
}
