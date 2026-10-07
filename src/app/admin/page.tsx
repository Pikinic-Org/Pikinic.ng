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
import { listConsultants } from "@/lib/admin/api/consultants";
import { listJobApplications } from "@/lib/admin/api/job-applications";
import { listJobs } from "@/lib/admin/api/jobs";
import { getJobState } from "@/components/admin/job-state-pill";
import { formatNaira } from "@/lib/admin/utils/format";
import { getBookingMetrics } from "@/lib/admin/utils/metrics";

const quickLinks = [
  { href: "/admin/blogs/new", label: "Write a Blog Post" },
  { href: "/admin/flights/new", label: "Add a Flight Offer" },
  { href: "/admin/packages/new", label: "Add a Travel Package" },
  { href: "/admin/webinars/new", label: "Create a Webinar" },
  { href: "/admin/careers/new", label: "Add a Job" },
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

  const [consultantStats, setConsultantStats] = useState<{
    total: number;
    paid: number;
    pending: number;
    revenue: number;
  } | null>(null);

  const [careerStats, setCareerStats] = useState<{
    openJobs: number;
    applications: number;
    newApplications: number;
    shortlisted: number;
  } | null>(null);

  useEffect(() => {
    Promise.allSettled([listJobs(), listJobApplications()]).then(([jobs, applications]) => {
      const jobRows = jobs.status === "fulfilled" ? jobs.value : [];
      const applicationRows = applications.status === "fulfilled" ? applications.value : [];
      setCareerStats({
        openJobs: jobRows.filter((job) => getJobState(job) === "open").length,
        applications: applicationRows.length,
        newApplications: applicationRows.filter((a) => a.status === "new").length,
        shortlisted: applicationRows.filter((a) => a.status === "shortlisted").length,
      });
    });
  }, []);

  useEffect(() => {
    listConsultants()
      .then((rows) => {
        const paid = rows.filter((c) => c.paymentStatus === "paid");
        setConsultantStats({
          total: rows.length,
          paid: paid.length,
          pending: rows.length - paid.length,
          revenue: paid.reduce((sum, c) => sum + c.amount, 0),
        });
      })
      .catch(() => setConsultantStats({ total: 0, paid: 0, pending: 0, revenue: 0 }));
  }, []);

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

      <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
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
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
            Travel Consultancy Training
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Registrations</span>
              <span className="font-semibold text-text-primary">{consultantStats ? consultantStats.total : "…"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Paid</span>
              <span className="font-semibold text-text-primary">{consultantStats ? consultantStats.paid : "…"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Awaiting payment</span>
              <span className="font-semibold text-text-primary">{consultantStats ? consultantStats.pending : "…"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Revenue</span>
              <span className="font-semibold text-text-primary">
                {consultantStats ? formatNaira(consultantStats.revenue) : "…"}
              </span>
            </div>
          </div>
          <Link
            href="/admin/forms/travel-consultant"
            className="mt-5 inline-block text-xs font-semibold uppercase tracking-widest text-green-700 hover:text-green-800"
          >
            View all registrations →
          </Link>
        </div>

        <div className="rounded-[2px] border border-border-primary p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Careers</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Open jobs</span>
              <span className="font-semibold text-text-primary">{careerStats ? careerStats.openJobs : "…"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Applications</span>
              <span className="font-semibold text-text-primary">{careerStats ? careerStats.applications : "…"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">New, not yet reviewed</span>
              <span className="font-semibold text-text-primary">{careerStats ? careerStats.newApplications : "…"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Shortlisted</span>
              <span className="font-semibold text-text-primary">{careerStats ? careerStats.shortlisted : "…"}</span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            <Link
              href="/admin/forms/careers"
              className="text-xs font-semibold uppercase tracking-widest text-green-700 hover:text-green-800"
            >
              View applications →
            </Link>
            <Link
              href="/admin/careers"
              className="text-xs font-semibold uppercase tracking-widest text-green-700 hover:text-green-800"
            >
              Manage jobs →
            </Link>
          </div>
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
