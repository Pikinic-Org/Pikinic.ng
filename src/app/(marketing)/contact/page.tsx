import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { InlinePhoto } from "@/components/ui/inline-photo";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { SocialIcon } from "@/components/ui/social-icon";
import { ContactForm } from "@/components/contact/contact-form";
import { directorContact, siteConfig, socialLinks } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Pikinic team.",
};

const instagram = socialLinks.find((s) => s.label === "Instagram");
const whatsappHref = `https://wa.me/${directorContact.whatsapp.replace(/[^0-9]/g, "")}`;

export default function ContactPage() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">

      <Container className="relative">
        <ScrollReveal className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h1 className="text-4xl font-semibold leading-[1.02] tracking-tight text-text-primary sm:text-5xl md:text-6xl">
              We&rsquo;re <span className="text-green-700">ready</span>{" "}
              <InlinePhoto src="/images/stay-ride.jpg" alt="Short-stay apartment" /> when you are.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-text-secondary">
              Have a question? Not sure which service you need? Send us a
              message and we&rsquo;ll come back to you with exactly the
              right direction.
            </p>

            <dl className="mt-12 space-y-6 border-t border-border-primary pt-8 text-sm">
              <div>
                <dt className="text-sm text-text-secondary">
                  Office
                </dt>
                <dd className="mt-1 text-base text-text-primary">{siteConfig.address}</dd>
              </div>
            </dl>

            <div className="mt-10 border-t border-border-primary pt-8">
              <p className="text-sm text-text-secondary">
                Other ways to reach us
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
                <a
                  href={`mailto:${directorContact.email}`}
                  className="group flex items-center gap-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-primary text-text-secondary transition-colors group-hover:border-green-600 group-hover:text-green-700">
                    <SocialIcon icon="mail" className="h-4 w-4" />
                  </span>
                  <span className="text-base font-medium text-text-primary transition-colors group-hover:text-green-700">
                    {directorContact.email}
                  </span>
                </a>
                {instagram && (
                  <a
                    href={instagram.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex items-center gap-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-primary text-text-secondary transition-colors group-hover:border-green-600 group-hover:text-green-700">
                      <SocialIcon icon="instagram" className="h-4 w-4" />
                    </span>
                    <span className="text-base font-medium text-text-primary transition-colors group-hover:text-green-700">
                      @pikinic
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <ContactForm />
        </ScrollReveal>
      </Container>
    </section>
  );
}
