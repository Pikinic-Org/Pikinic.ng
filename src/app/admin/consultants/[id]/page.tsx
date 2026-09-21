"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminSelect, AdminTextArea } from "@/components/admin/fields";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { PaymentPill, ReviewPill } from "@/components/admin/consultant-pills";
import { Button } from "@/components/ui/button";
import { deleteConsultant, getConsultant, updateConsultant } from "@/lib/admin/api/consultants";
import { ApiError } from "@/lib/admin/api/client";
import { formatAdminDateTime, formatNaira } from "@/lib/admin/utils/format";
import type { ConsultantReviewStatus, TravelConsultant } from "@/lib/admin/types";

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-sm text-text-primary">{children || "—"}</dd>
    </div>
  );
}

export default function ConsultantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [consultant, setConsultant] = useState<TravelConsultant | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    getConsultant(id)
      .then(setConsultant)
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) setNotFound(true);
      });
  }, [id]);

  if (notFound) {
    return (
      <div>
        <AdminPageHeader title="Consultant Not Found" />
        <p className="text-sm text-text-secondary">No travel consultant matches that id.</p>
      </div>
    );
  }

  if (!consultant) {
    return (
      <div>
        <AdminPageHeader title="Loading…" />
      </div>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const data = new FormData(e.currentTarget);

    setSubmitting(true);
    try {
      await updateConsultant(id, {
        reviewStatus: data.get("reviewStatus") as ConsultantReviewStatus,
        adminNotes: String(data.get("adminNotes") ?? ""),
      });
      router.push(`/admin/consultants?updated=${id}`);
    } catch {
      setFormError("Could not save changes. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    await deleteConsultant(id);
    router.push("/admin/consultants");
  }

  return (
    <div>
      <AdminPageHeader
        title={consultant.fullName}
        description={`Registered ${formatAdminDateTime(consultant.createdAt)}`}
        action={<ConfirmDeleteButton onConfirm={handleDelete} />}
      />

      <div className="grid gap-10 lg:grid-cols-2">
        <dl className="space-y-5">
          <div className="flex gap-2">
            <PaymentPill status={consultant.paymentStatus} />
            <ReviewPill status={consultant.reviewStatus} />
          </div>
          <Detail label="Email">{consultant.email}</Detail>
          <Detail label="WhatsApp">{consultant.whatsapp}</Detail>
          <Detail label="City">{consultant.city}</Detail>
          <Detail label="Notes from applicant">{consultant.motivation}</Detail>
          <Detail label="Heard about us via">{consultant.referralSource}</Detail>
          <Detail label="Payment">
            {formatNaira(consultant.amount)}
            {consultant.paidAt ? ` — paid ${formatAdminDateTime(consultant.paidAt)}` : " — not yet paid"}
          </Detail>
          <Detail label="Monnify transaction">{consultant.monnifyTransactionReference}</Detail>
        </dl>

        <form onSubmit={handleSubmit} className="space-y-5 self-start rounded-[2px] border border-border-primary p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Programme</h2>
          <AdminSelect label="Programme Stage" name="reviewStatus" defaultValue={consultant.reviewStatus}>
            <option value="registered">Registered</option>
            <option value="attended">Attended training</option>
            <option value="internship">On paid internship</option>
          </AdminSelect>
          <AdminTextArea
            label="Internal Notes"
            name="adminNotes"
            rows={5}
            defaultValue={consultant.adminNotes ?? ""}
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}
