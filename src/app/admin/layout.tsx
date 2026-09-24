import type { Metadata } from "next";
import { grift, nexa } from "@/app/fonts";
import { AdminShell } from "@/components/admin/admin-shell";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s — Pikinic Admin",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en" className={`${grift.variable} ${nexa.variable} h-full antialiased`}>
      <body className="min-h-full bg-background-primary text-text-primary">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
