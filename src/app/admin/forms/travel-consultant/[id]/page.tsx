"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminSelect, AdminTextArea } from "@/components/admin/fields";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { PaymentPill, ReviewPill } from "@/components/admin/consultant-pills";
import { Button } from "@/components/ui/button";
import { deleteConsultant, getConsultant, updateConsultant } from "@/lib/admin/api/consultants";
import { ApiError } from "@/lib/admin/api/client";
import { formatAdminDateTime, formatNaira } from "@/lib/admin/utils/format";
import { programmeLabel } from "@/lib/constants";
import type { ConsultantPaymentStatus, ConsultantReviewStatus, TravelConsultant } from "@/lib/admin/types";

// This page sits under the Forms header and tabs, so it uses a smaller title.
function DetailHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <Link
          href="/admin/forms/travel-consultant"
          className="text-xs font-semibold uppercase tracking-widest text-text-tertiary hover:text-text-secondary"
        >
          ← All registrations
        </Link>
        <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight text-text-primary">{title}</h2>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

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
        <DetailHeader title="Registration not found" />
        <p className="text-sm text-text-secondary">No registration matches that id.</p>
      </div>
    );
  }

  if (!consultant) {
    return (
      <div>
        <DetailHeader title="Loading…" />
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
        paymentStatus: data.get("paymentStatus") as ConsultantPaymentStatus,
        reviewStatus: data.get("reviewStatus") as ConsultantReviewStatus,
        adminNotes: String(data.get("adminNotes") ?? ""),
      });
      router.push(`/admin/forms/travel-consultant?updated=${id}`);
    } catch {
      setFormError("Could not save changes. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    await deleteConsultant(id);
    router.push("/admin/forms/travel-consultant");
  }

  return (
    <div>
      <DetailHeader
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
          <Detail label="Programme">{programmeLabel(consultant.programme)}</Detail>
          <Detail label="Payment code">{consultant.paymentCode}</Detail>
          <Detail label="Notes from applicant">{consultant.motivation}</Detail>
          <Detail label="Heard about us via">{consultant.referralSource}</Detail>
          <Detail label="Payment">
            {formatNaira(consultant.amount)}
            {consultant.paidAt ? ` — paid ${formatAdminDateTime(consultant.paidAt)}` : " — not yet paid"}
          </Detail>
          {consultant.monnifyTransactionReference && (
            <Detail label="Monnify transaction">{consultant.monnifyTransactionReference}</Detail>
          )}
        </dl>

        <form onSubmit={handleSubmit} className="space-y-5 self-start rounded-[2px] border border-border-primary p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Programme</h2>
          <AdminSelect label="Payment" name="paymentStatus" defaultValue={consultant.paymentStatus}>
            <option value="pending">Awaiting payment</option>
            <option value="paid">Paid (transfer received)</option>
          </AdminSelect>
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
