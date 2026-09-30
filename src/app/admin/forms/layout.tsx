"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { cn } from "@/lib/utils";

// One sidebar entry for every public sign-up form. Add a tab here (and a page
// under this folder) when a new form goes live, rather than a sidebar link.
const tabs = [
  { href: "/admin/forms/growth-conference", label: "Growth Conference" },
  { href: "/admin/forms/travel-consultant", label: "Travel Consultant" },
];

export default function FormsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <AdminPageHeader title="Forms" description="Everyone who signed up through a form on the website." />

      <nav className="-mt-2 mb-8 flex gap-2 border-b border-border-primary">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "-mb-px border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors",
                active
                  ? "border-green-700 text-text-primary"
                  : "border-transparent text-text-tertiary hover:text-text-secondary"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
