import { apiFetch } from "@/lib/admin/api/client";
import type { FlightBookingRow } from "@/lib/admin/types";

export const listFlightBookings = () => apiFetch<FlightBookingRow[]>("/api/admin/bookings");
