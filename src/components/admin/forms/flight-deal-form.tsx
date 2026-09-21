"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FocusEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { AdminSelect, AdminTextInput, ImagePickerField, type FieldState } from "@/components/admin/fields";
import { createFlightDeal, updateFlightDeal } from "@/lib/admin/api/deals";
import type { FlightDeal } from "@/lib/admin/types";

const tripTypes = ["oneway", "roundtrip"] as const;

type FieldKey = "fromCode" | "toCode" | "tripType" | "discountPercent";
type FieldErrors = Partial<Record<FieldKey, string>>;

function validate(data: Record<string, FormDataEntryValue>): FieldErrors {
  const errors: FieldErrors = {};
  if (!String(data.fromCode ?? "").trim()) errors.fromCode = "Origin airport code is required.";
  if (!String(data.toCode ?? "").trim()) errors.toCode = "Destination airport code is required.";
  const discount = Number(data.discountPercent);
  if (!data.discountPercent || Number.isNaN(discount) || discount < 1 || discount > 100) {
    errors.discountPercent = "Enter a discount between 1 and 100.";
  }
  return errors;
}

export function FlightDealForm({ initialDeal }: { initialDeal?: FlightDeal }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = !!initialDeal;

  const [imageUrl, setImageUrl] = useState(initialDeal?.imageUrl ?? "");
  const [active, setActive] = useState(initialDeal?.active ?? true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function fieldState(field: FieldKey): FieldState {
    if (!touched[field]) return "default";
    return fieldErrors[field] ? "invalid" : "valid";
  }

  function revalidate() {
    if (!formRef.current) return {};
    const data = Object.fromEntries(new FormData(formRef.current).entries());
    const errors = validate(data);
    setFieldErrors(errors);
    return errors;
  }

  function handleBlur(e: FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    const target = e.currentTarget;
    if (!target) return;
    setTouched((prev) => ({ ...prev, [target.name]: true }));
    revalidate();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setTouched({ fromCode: true, toCode: true, tripType: true, discountPercent: true });
    const errors = revalidate();
    if (Object.keys(errors).length > 0) return;

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    const dealData = {
      fromCode: data.fromCode.toUpperCase(),
      toCode: data.toCode.toUpperCase(),
      tripType: data.tripType as FlightDeal["tripType"],
      discountPercent: Number(data.discountPercent),
      label: data.label || undefined,
      imageUrl: imageUrl || undefined,
      active,
      validUntil: data.validUntil ? new Date(data.validUntil).toISOString() : undefined,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateFlightDeal(initialDeal.id, dealData);
        router.push(`/admin/deals?updated=${initialDeal.id}`);
      } else {
        const created = await createFlightDeal(dealData);
        router.push(`/admin/deals?created=${created.id}`);
      }
    } catch {
      setFormError("Could not save this flight deal. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <AdminTextInput
          label="Origin Airport Code"
          name="fromCode"
          placeholder="LOS"
          maxLength={3}
          defaultValue={initialDeal?.fromCode}
          onBlur={handleBlur}
          state={fieldState("fromCode")}
          error={fieldErrors.fromCode}
        />
        <AdminTextInput
          label="Destination Airport Code"
          name="toCode"
          placeholder="ABV"
          maxLength={3}
          defaultValue={initialDeal?.toCode}
          onBlur={handleBlur}
          state={fieldState("toCode")}
          error={fieldErrors.toCode}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <AdminSelect
          label="Trip Type"
          name="tripType"
          defaultValue={initialDeal?.tripType ?? tripTypes[0]}
          onBlur={handleBlur}
          state={fieldState("tripType")}
          error={fieldErrors.tripType}
        >
          {tripTypes.map((type) => (
            <option key={type} value={type}>
              {type === "oneway" ? "One way" : "Round trip"}
            </option>
          ))}
        </AdminSelect>
        <AdminTextInput
          label="Discount (%)"
          name="discountPercent"
          type="number"
          min={1}
          max={100}
          defaultValue={initialDeal?.discountPercent}
          onBlur={handleBlur}
          state={fieldState("discountPercent")}
          error={fieldErrors.discountPercent}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <AdminTextInput
          label="Label (optional)"
          name="label"
          placeholder="Independence Day Sale"
          defaultValue={initialDeal?.label}
        />
        <AdminTextInput
          label="Valid Until (optional)"
          name="validUntil"
          type="date"
          defaultValue={initialDeal?.validUntil?.slice(0, 10)}
        />
      </div>
      <ImagePickerField label="Image (optional)" name="imageUrl" value={imageUrl} onChange={setImageUrl} />

      <label className="flex items-center gap-2.5 text-sm font-medium text-text-primary">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4 rounded-[2px] border-border-primary accent-green-700"
        />
        Active — this deal is currently applied to matching searches
      </label>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? "Saving…" : isEdit ? "Save Changes" : "Add Flight Deal"}
      </Button>
    </form>
  );
}
