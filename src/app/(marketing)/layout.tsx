import type { Metadata } from "next";
import { grift, nexa } from "@/app/fonts";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CustomCursor } from "@/components/ui/custom-cursor";
import { siteConfig } from "@/lib/constants";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — Travel, Study Abroad, Stay & Ride`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    title: `${siteConfig.name} — Travel, Study Abroad, Stay & Ride`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${grift.variable} ${nexa.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col  text-text-primary">
        <CustomCursor />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
