import { AdminPageHeader } from "@/components/admin/page-header";
import { JobForm } from "@/components/admin/forms/job-form";

export default function NewJobPage() {
  return (
    <div>
      <AdminPageHeader title="New Job" />
      <JobForm />
    </div>
  );
}
