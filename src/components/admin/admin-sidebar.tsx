"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminIcon } from "@/components/admin/admin-icon";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Overview", icon: "dashboard" as const, exact: true },
  { href: "/admin/blogs", label: "Blogs", icon: "blog" as const },
  { href: "/admin/flights", label: "Flight Offers", icon: "flight" as const },
  { href: "/admin/deals", label: "Flight Deals", icon: "deal" as const },
  { href: "/admin/packages", label: "Travel Packages", icon: "package" as const },
  { href: "/admin/webinars", label: "Webinars", icon: "webinar" as const },
  { href: "/admin/bookings", label: "Bookings", icon: "booking" as const },
  { href: "/admin/consultants", label: "Travel Consultants", icon: "consultant" as const },
  { href: "/admin/guide-leads", label: "Guide Leads", icon: "guide" as const },
  { href: "/admin/media", label: "Media", icon: "media" as const },
];

function LogoMark({ className }: { className?: string }) {
  return (
    <svg width="28" height="21" viewBox="0 0 62 47" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M42.5978 0C42.3793 0 41.7808 0.0221622 41.4419 0.0348263L41.4103 0.0379923H41.3849L11.9539 1.84579L16.1086 10.7297L41.86 9.14664C41.9866 9.14348 42.4521 9.12131 42.5978 9.12131C47.9843 9.12131 52.3733 13.5031 52.3733 18.8917C52.3733 24.2771 47.9843 28.6588 42.5978 28.6588C42.4268 28.6588 42.2653 28.6588 42.1323 28.6525L32.7273 28.0826L26.8974 37.4604H11.2192L15.6367 26.9809L6.32353 26.4015L0.52218 38.7965C-1.17516 42.4215 1.47218 46.5849 5.47803 46.5849H28.7911C30.5676 46.5849 32.2333 45.7237 33.2593 44.2705L38.0156 37.5395L41.6003 37.7612H41.6383C41.822 37.7707 42.0151 37.777 42.221 37.7802C51.36 37.9416 59.3812 31.6381 61.1292 22.6687C63.482 10.6062 54.2575 0 42.5978 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col overflow-hidden bg-green-900 text-neutral-0">
      <div className="relative flex h-20 shrink-0 items-center gap-2.5 px-6">
        <Link href="/admin" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
          <LogoMark className="text-green-400" />
          Pikinic <span className="text-green-400">Admin</span>
        </Link>
      </div>

      <nav className="relative flex-1 space-y-1 overflow-y-auto px-4">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[2px] px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors",
                active
                  ? "bg-green-200 text-green-900"
                  : "text-neutral-0/70 hover:bg-neutral-0/10 hover:text-neutral-0"
              )}
            >
              <AdminIcon icon={item.icon} className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative shrink-0 border-t border-neutral-0/15 p-4">
        <Link
          href="/admin/login"
          className="flex items-center gap-3 rounded-[2px] px-3 py-2.5 text-sm font-semibold uppercase tracking-wide text-neutral-0/70 transition-colors hover:bg-neutral-0/10 hover:text-neutral-0"
        >
          <AdminIcon icon="logout" className="h-4 w-4 shrink-0" />
          Log Out
        </Link>
      </div>
    </aside>
  );
}
