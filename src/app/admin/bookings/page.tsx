"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminTable, type AdminTableColumn } from "@/components/admin/admin-table";
import { FlightBookingPill } from "@/components/admin/flight-booking-pill";
import { StatTile, StatTileGrid } from "@/components/admin/stat-tile";
import { listFlightBookings } from "@/lib/admin/api/bookings";
import { formatAdminDate, formatAdminDateTime, formatNaira } from "@/lib/admin/utils/format";
import type { FlightBookingRow, FlightBookingStatus } from "@/lib/admin/types";

type Filter = "all" | FlightBookingStatus;

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "reserved", label: "Successful" },
  { key: "paid", label: "Paid · Not Reserved" },
  { key: "pending_payment", label: "Awaiting Payment" },
  { key: "failed", label: "Failed" },
];

const isPaid = (booking: FlightBookingRow) => booking.status === "paid" || booking.status === "reserved";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<FlightBookingRow[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    listFlightBookings()
      .then(setBookings)
      .catch(() => setError("Could not load flight bookings."));
  }, []);

  const metrics = useMemo(() => {
    const all = bookings ?? [];
    const paid = all.filter(isPaid);
    const count = (status: FlightBookingStatus) => all.filter((b) => b.status === status).length;
    return {
      total: all.length,
      paid: paid.length,
      revenue: paid.reduce((sum, b) => sum + b.amount, 0),
      successful: count("reserved"),
      paidNotReserved: count("paid"),
      awaitingPayment: count("pending_payment"),
      failed: count("failed"),
      refunded: all.filter((b) => b.refundStatus).length,
    };
  }, [bookings]);

  const rows = useMemo(() => {
    const all = bookings ?? [];
    return filter === "all" ? all : all.filter((b) => b.status === filter);
  }, [bookings, filter]);

  const columns: AdminTableColumn<FlightBookingRow>[] = [
    {
      key: "customer",
      header: "Customer",
      cell: (booking) => (
        <div>
          <div className="font-semibold text-text-primary">{booking.customerName}</div>
          <div className="text-xs text-text-tertiary">{booking.customerEmail}</div>
        </div>
      ),
    },
    { key: "phone", header: "Phone", cell: (booking) => booking.customerPhone },
    {
      key: "route",
      header: "Route",
      cell: (booking) => (
        <div>
          <div className="font-semibold text-text-primary">
            {booking.fromCode} → {booking.toCode}
          </div>
          <div className="text-xs text-text-tertiary">
            {formatAdminDate(booking.departureDate)}
            {booking.returnDate ? ` – ${formatAdminDate(booking.returnDate)}` : ""}
          </div>
        </div>
      ),
    },
    { key: "amount", header: "Amount", cell: (booking) => formatNaira(booking.amount) },
    {
      key: "status",
      header: "Status",
      cell: (booking) => (
        <div>
          <FlightBookingPill status={booking.status} />
          {booking.refundStatus && (
            <div className="mt-1 text-xs text-text-tertiary">Refund: {booking.refundStatus}</div>
          )}
        </div>
      ),
    },
    { key: "pnr", header: "PNR", cell: (booking) => booking.pnr ?? "—" },
    { key: "bookedAt", header: "Booked", cell: (booking) => formatAdminDateTime(booking.createdAt) },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Bookings"
        description="Flight bookings from Travel & Tours — who paid, what succeeded, and what failed."
      />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <StatTileGrid>
        <StatTile label="Total Bookings" value={bookings ? String(metrics.total) : "…"} />
        <StatTile label="Revenue" value={bookings ? formatNaira(metrics.revenue) : "…"} accent />
        <StatTile label="Paid" value={bookings ? String(metrics.paid) : "…"} />
        <StatTile label="Awaiting Payment" value={bookings ? String(metrics.awaitingPayment) : "…"} />
      </StatTileGrid>

      <div className="mt-6">
        <StatTileGrid>
          <StatTile label="Successful" value={bookings ? String(metrics.successful) : "…"} />
          <StatTile label="Paid · Not Reserved" value={bookings ? String(metrics.paidNotReserved) : "…"} />
          <StatTile label="Failed" value={bookings ? String(metrics.failed) : "…"} />
          <StatTile label="Refunds Started" value={bookings ? String(metrics.refunded) : "…"} />
        </StatTileGrid>
      </div>

      <div className="mb-4 mt-8 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-[2px] px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
              filter === f.key
                ? "bg-green-200 text-green-900"
                : "border border-border-primary text-text-secondary hover:bg-neutral-900/[0.04]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {bookings === null && !error ? (
        <div className="rounded-[2px] border border-border-primary p-12 text-center text-sm text-text-tertiary">
          Loading…
        </div>
      ) : (
        <AdminTable
          columns={columns}
          rows={rows}
          rowKey={(booking) => booking.id}
          emptyMessage="No bookings match this filter."
        />
      )}
    </div>
  );
}
