import { AdminPageHeader } from "@/components/admin/page-header";
import { FlightDealForm } from "@/components/admin/forms/flight-deal-form";

export default function NewFlightDealPage() {
  return (
    <div>
      <AdminPageHeader title="New Flight Deal" />
      <FlightDealForm />
    </div>
  );
}
