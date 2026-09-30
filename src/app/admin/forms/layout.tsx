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

      <nav className="-mt-2 mb-8 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border-primary [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "shrink-0 whitespace-nowrap border-b-2 px-2.5 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors sm:px-4 sm:tracking-widest",
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
