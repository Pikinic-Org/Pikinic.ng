import type { Metadata } from "next";
import Image from "next/image";
import { DeepGreenBackdrop } from "@/components/ui/brand-pattern";
import { Container } from "@/components/ui/container";
import { InlinePhoto } from "@/components/ui/inline-photo";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Cta } from "@/components/sections/cta";
import { team } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About",
  description:
    "Pikinic is a Nigerian travel management company founded in 2023, building trust into every trip, stay, and journey abroad.",
};

// Simple 24px line icons, one per value.
const icons = {
  transparency: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  reliability: (
    <>
      <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  efficiency: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5M10 2h4" />
    </>
  ),
  customer: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </>
  ),
  integrity: (
    <>
      <path d="M12 3v18M5 21h14M4 7h16" />
      <path d="m7 7-3 7a3 3 0 0 0 6 0L7 7Zm10 0-3 7a3 3 0 0 0 6 0l-3-7Z" />
    </>
  ),
};

const values: { name: string; description: string; icon: keyof typeof icons }[] = [
  {
    name: "Transparency",
    icon: "transparency",
    description: "Clear, honest pricing and information, with no hidden charges.",
  },
  {
    name: "Reliability",
    icon: "reliability",
    description: "Professional handling and consistent communication, start to finish.",
  },
  {
    name: "Efficiency",
    icon: "efficiency",
    description: "Streamlined booking and fast turnaround on every request.",
  },
  {
    name: "Customer-centred",
    icon: "customer",
    description: "Recommendations tailored to each traveller's needs and budget.",
  },
  {
    name: "Integrity",
    icon: "integrity",
    description: "Ethical, accountable practice that builds long-term trust.",
  },
];

const missionVision = [
  {
    title: "Mission",
    text: "To make moving, studying, and travelling abroad feel safe, simple, and stress-free for every Nigerian who decides it is time to go somewhere.",
  },
  {
    title: "Vision",
    text: "To become one of Nigeria’s most trusted travel management companies, recognised for effortless travel experiences, innovative solutions, and exceptional customer satisfaction.",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);
}

export default function AboutPage() {
  return (
    <>
      <section className="pb-16 pt-24 md:pb-24 md:pt-32 lg:pt-40">
        <Container>
          <ScrollReveal>
            <h1 className="max-w-6xl text-5xl font-semibold leading-[1.05] tracking-tight text-text-primary sm:text-6xl md:text-7xl lg:text-8xl">
              Built on trust <InlinePhoto src="/images/travel-tours.jpg" alt="Friends celebrating on a beach" />{" "}
              not <span className="text-green-700">transactions.</span>
            </h1>
            <p className="mt-10 max-w-2xl text-lg leading-relaxed text-text-secondary md:ml-auto md:text-xl">
              Pikinic is a Nigerian travel management company, founded in 2023 after watching too
              many Nigerians misled, overcharged, and abandoned by the people meant to help them
              travel. We build long-term relationships with our travellers, not one-off
              transactions, with offices in Lagos and Osun.
            </p>
          </ScrollReveal>
        </Container>
      </section>

      <section className="pb-20 md:pb-28">
        <Container>
          <ScrollReveal className="grid gap-4 md:grid-cols-2 md:gap-6">
            {missionVision.map((item, i) => {
              const dark = i === 0;
              return (
                <div
                  key={item.title}
                  className={
                    dark
                      ? "relative isolate flex min-h-80 flex-col justify-between gap-10 overflow-hidden rounded-2xl bg-green-900 p-6 text-neutral-0 md:p-10"
                      : "flex min-h-80 flex-col justify-between gap-10 rounded-2xl bg-surface-primary p-6 text-text-primary md:p-10"
                  }
                >
                  {dark && <DeepGreenBackdrop />}
                  <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">{item.title}</h2>
                  <p className={dark ? "max-w-md text-lg leading-relaxed text-neutral-0/75" : "max-w-md text-lg leading-relaxed text-text-secondary"}>
                    {item.text}
                  </p>
                </div>
              );
            })}
          </ScrollReveal>
        </Container>
      </section>

      <section className="py-20 md:py-28">
        <Container>
          <ScrollReveal>
            <h2 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight text-text-primary sm:text-5xl">
              Values we don&rsquo;t bend on
            </h2>

            <dl className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {values.map((value) => (
                <div
                  key={value.name}
                  className="flex min-h-56 flex-col justify-between gap-8 rounded-2xl bg-surface-primary p-6"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-green-500/15 text-green-800">
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
                      {icons[value.icon]}
                    </svg>
                  </span>
                  <div className="flex flex-col gap-2">
                    <dt className="text-lg font-medium leading-tight tracking-tight text-text-primary">
                      {value.name}
                    </dt>
                    <dd className="text-sm leading-relaxed text-text-secondary">{value.description}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </ScrollReveal>
        </Container>
      </section>

      <section className="py-20 md:py-28">
        <Container>
          <ScrollReveal className="grid gap-10 md:grid-cols-[minmax(0,5fr)_7fr] md:gap-16">
            <div className="relative isolate aspect-[4/5] overflow-hidden rounded-2xl bg-green-900 md:sticky md:top-28 md:self-start">
              <DeepGreenBackdrop />
              <Image
                src="/images/founder.png"
                alt="Adeniyi Akintoye, Director of Pikinic"
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-contain object-bottom"
              />
            </div>

            <div className="max-w-2xl space-y-6 text-lg leading-relaxed text-text-secondary">
              <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight text-text-primary sm:text-5xl">
                Why we <span className="text-green-700">started.</span>
              </h2>
              <p>
                Before Pikinic, I spent eight years in Nigerian banking. I understood proof of
                funds, financial documentation, and the institutional systems that either open or
                close doors for people. And I kept watching something happen.
              </p>
              <p>
                Clients who were ready. Clients who had the qualifications. Clients who had the
                money. Being failed by agents who did not know enough, did not care enough, or
                simply disappeared the moment things got complicated.
              </p>
              <p>
                I left banking with one clear goal: to build a company that Nigerians can actually
                trust with something this important. A company that handles the whole journey, not
                just one part of it. A company where you never pay an agent fee and you always know
                exactly what is happening with your application or your booking.
              </p>
              <p className="text-2xl font-semibold leading-tight tracking-tight text-green-700 sm:text-3xl">
                That&rsquo;s why Pikinic exists.
              </p>

              <div className="pt-2">
                <div className="text-base font-medium text-text-primary">Adeniyi Akintoye</div>
                <div className="mt-0.5 text-sm text-text-secondary">Director</div>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </section>

      <section id="team" className="px-3 md:px-4">
        <div className="relative isolate overflow-hidden rounded-2xl bg-green-900 py-20 text-neutral-0 md:py-28">
          <Container>
            <ScrollReveal>
              <div className="max-w-xl">
                <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                  Meet the team
                </h2>
                <p className="mt-4 text-base leading-relaxed text-neutral-0/70 sm:text-lg">
                  A small team handling every leg of the journey personally. More hands are joining
                  us as Pikinic grows.
                </p>
              </div>

              <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {team.map((member) => (
                  <div key={member.name} className="flex flex-col gap-4 rounded-xl bg-neutral-0/[0.06] p-3">
                    <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg bg-neutral-0/[0.06]">
                      {member.photo ? (
                        <Image
                          src={member.photo}
                          alt={member.name}
                          fill
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                          className="object-contain object-bottom"
                        />
                      ) : (
                        <span className="font-heading text-6xl font-semibold text-neutral-0/30">
                          {initials(member.name)}
                        </span>
                      )}
                    </div>
                    <div className="px-3 pb-3">
                      <div className="text-xl font-medium leading-tight tracking-tight">{member.name}</div>
                      <div className="mt-1 text-sm text-neutral-0/70">{member.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </div>
      </section>

      <div className="h-3 md:h-4" />
      <Cta />
    </>
  );
}
