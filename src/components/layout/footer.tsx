import Link from "next/link";
import { Container } from "@/components/ui/container";
import { NewsletterForm } from "@/components/ui/newsletter-form";
import { SocialIcon } from "@/components/ui/social-icon";
import { footerColumns, serviceSocialLinks, siteConfig, socialLinks } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="px-3 pb-3 md:px-4 md:pb-4">
      <div className="overflow-hidden rounded-2xl bg-neutral-900 text-neutral-0">
        <Container className="py-16">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <div className="space-y-6">
              <p className="max-w-sm text-base text-neutral-400">
                Trip planning, study abroad, and stays, handled end to end for you.
              </p>

              <div className="space-y-1 text-sm text-neutral-300">
                <p>{siteConfig.address}</p>
                <Link href={`mailto:${siteConfig.email}`} className="block transition-colors hover:text-neutral-0">
                  {siteConfig.email}
                </Link>
                {siteConfig.phones.map((phone) => (
                  <Link
                    key={phone}
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="block transition-colors hover:text-neutral-0"
                  >
                    {phone}
                  </Link>
                ))}
              </div>

              <div className="flex gap-2">
                {socialLinks.map((social) => (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={social.label}
                    className="flex size-10 items-center justify-center rounded-full bg-neutral-0/10 text-neutral-0 transition-colors hover:bg-green-500 hover:text-neutral-900"
                  >
                    <SocialIcon icon={social.icon} className="size-4" />
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Stay in the loop</h3>
              <p className="mt-2 max-w-sm text-sm text-neutral-400">
                New routes, scholarships and travel tips, straight to your inbox. No spam.
              </p>
              <NewsletterForm className="mt-5" />
            </div>
          </div>

          <div className="mt-16 grid gap-10 border-t border-neutral-0/10 pt-12 sm:grid-cols-3">
            {footerColumns.map((col) => (
              <nav key={col.heading} aria-label={col.heading}>
                <h3 className="text-sm text-neutral-400">{col.heading}</h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-neutral-200 transition-colors hover:text-neutral-0"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="mt-16 border-t border-neutral-0/10 pt-12">
            <h3 className="text-sm text-neutral-400">Follow along</h3>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {serviceSocialLinks.map((service) => (
                <div key={service.name} className="flex items-center justify-between gap-4 rounded-xl bg-neutral-0/5 p-4">
                  <span className="text-sm text-neutral-200">{service.name}</span>
                  <div className="flex gap-1">
                    {service.links.map((social) => (
                      <Link
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`${service.name} on ${social.label}`}
                        className="flex size-9 items-center justify-center rounded-full text-neutral-300 transition-colors hover:bg-neutral-0/10 hover:text-green-500"
                      >
                        <SocialIcon icon={social.icon} className="size-4" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>

        <div className="border-t border-neutral-0/10">
          <Container className="py-6 text-sm text-neutral-500">
            <p>
              {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
            </p>
          </Container>
        </div>

        <p
          aria-hidden
          className="select-none overflow-hidden px-6 pb-4 text-center font-heading text-[18vw] font-semibold leading-none tracking-tight text-neutral-0/[0.06] md:px-16"
        >
          Pikinic
        </p>
      </div>
    </footer>
  );
}
