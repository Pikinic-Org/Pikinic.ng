import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { Intro } from "@/components/sections/intro";
import { Services } from "@/components/sections/services";
import { Stats } from "@/components/sections/stats";
import { Testimonials } from "@/components/sections/testimonials";
import { Cta } from "@/components/sections/cta";
import { siteConfig, socialLinks } from "@/lib/constants";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Tells Google what Pikinic is, from siteConfig so there is one source.
// Only Instagram is listed in sameAs: the other handles in socialLinks are
// still placeholders, and a wrong profile here would be worse than none.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  legalName: "Pikinic Nigeria Limited",
  description: siteConfig.description,
  url: siteConfig.url,
  foundingDate: String(siteConfig.founded),
  email: siteConfig.email,
  telephone: siteConfig.phones[0],
  address: { "@type": "PostalAddress", streetAddress: siteConfig.address, addressCountry: "NG" },
  sameAs: socialLinks.filter((link) => link.label === "Instagram").map((link) => link.href),
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <Hero />
      <Intro />
      <Services />
      <Stats />
      <Testimonials />
      <Cta />
    </>
  );
}
