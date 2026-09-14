"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatTile, StatTileGrid } from "@/components/admin/stat-tile";
import { useAdminStore } from "@/lib/admin/store";
import { listBlogPosts } from "@/lib/admin/api/blog";
import { listFlightOffers } from "@/lib/admin/api/flights";
import { listPackages } from "@/lib/admin/api/packages";
import { listWebinars } from "@/lib/admin/api/webinars";
import { formatNaira } from "@/lib/admin/utils/format";
import { getBookingMetrics } from "@/lib/admin/utils/metrics";

const quickLinks = [
  { href: "/admin/blogs/new", label: "Write a Blog Post" },
  { href: "/admin/flights/new", label: "Add a Flight Offer" },
  { href: "/admin/packages/new", label: "Add a Travel Package" },
  { href: "/admin/webinars/new", label: "Create a Webinar" },
];

export default function AdminOverviewPage() {
  const bookings = useAdminStore((state) => state.bookings);
  const metrics = getBookingMetrics(bookings);

  const [counts, setCounts] = useState<{
    blogPosts: number;
    flightOffers: number;
    packages: number;
    webinars: number;
  } | null>(null);

  useEffect(() => {
    Promise.allSettled([listBlogPosts(), listFlightOffers(), listPackages(), listWebinars()]).then(
      ([blogPosts, flightOffers, packages, webinars]) => {
        setCounts({
          blogPosts: blogPosts.status === "fulfilled" ? blogPosts.value.length : 0,
          flightOffers: flightOffers.status === "fulfilled" ? flightOffers.value.length : 0,
          packages: packages.status === "fulfilled" ? packages.value.length : 0,
          webinars: webinars.status === "fulfilled" ? webinars.value.length : 0,
        });
      }
    );
  }, []);

  return (
    <div>
      <AdminPageHeader
        title="Overview"
        description="A shared dashboard for Travel & Tours, Stay & Ride, and Webinar content."
      />

      <StatTileGrid>
        <StatTile label="Blog Posts" value={counts ? String(counts.blogPosts) : "…"} />
        <StatTile label="Flight Offers" value={counts ? String(counts.flightOffers) : "…"} />
        <StatTile label="Travel Packages" value={counts ? String(counts.packages) : "…"} />
        <StatTile label="Webinars" value={counts ? String(counts.webinars) : "…"} />
      </StatTileGrid>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2px] border border-border-primary p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
            Bookings Snapshot
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Total bookings</span>
              <span className="font-semibold text-text-primary">{metrics.totalBookings}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Total paid</span>
              <span className="font-semibold text-text-primary">{formatNaira(metrics.totalPaidAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Pending</span>
              <span className="font-semibold text-text-primary">{metrics.pendingCount}</span>
            </div>
          </div>
          <Link
            href="/admin/bookings"
            className="mt-5 inline-block text-xs font-semibold uppercase tracking-widest text-green-700 hover:text-green-800"
          >
            View all bookings →
          </Link>
        </div>

        <div className="rounded-[2px] border border-border-primary p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Quick Actions</h2>
          <div className="mt-4 space-y-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-[2px] px-3 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-neutral-900/[0.04]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
