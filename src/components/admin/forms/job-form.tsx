"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FocusEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { AdminSelect, AdminTextArea, AdminTextInput, type FieldState } from "@/components/admin/fields";
import { ApiError } from "@/lib/admin/api/client";
import { createJob, updateJob } from "@/lib/admin/api/jobs";
import { slugify } from "@/lib/admin/utils/slugify";
import { toDateTimeLocalValue } from "@/lib/admin/utils/format";
import { defaultJobLocation, jobCategories, jobTypes } from "@/lib/constants";
import type { Job, JobStatus } from "@/lib/admin/types";

type FieldKey =
  | "title"
  | "category"
  | "jobType"
  | "location"
  | "closesAt"
  | "summary"
  | "description"
  | "responsibilities"
  | "qualifications";
type FieldErrors = Partial<Record<FieldKey, string>>;

const required: Record<FieldKey, string> = {
  title: "Title is required.",
  category: "Pick a category.",
  jobType: "Pick a job type.",
  location: "Location is required.",
  closesAt: "Closing date and time are required.",
  summary: "Summary is required.",
  description: "Description is required.",
  responsibilities: "Add at least one responsibility.",
  qualifications: "Add at least one qualification.",
};

function validate(data: Record<string, FormDataEntryValue>): FieldErrors {
  const errors: FieldErrors = {};
  for (const key of Object.keys(required) as FieldKey[]) {
    if (!String(data[key] ?? "").trim()) errors[key] = required[key];
  }
  if (String(data.summary ?? "").length > 300) errors.summary = "Keep the summary under 300 characters.";
  return errors;
}

// One item per line in the form, an array in the API.
const toLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export function JobForm({ initialJob }: { initialJob?: Job }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = !!initialJob;

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
    const errors = validate(Object.fromEntries(new FormData(formRef.current).entries()));
    setFieldErrors(errors);
    return errors;
  }

  function handleBlur(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const target = e.currentTarget;
    setTouched((prev) => ({ ...prev, [target.name]: true }));
    revalidate();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setTouched(Object.fromEntries(Object.keys(required).map((key) => [key, true])));
    if (Object.keys(revalidate()).length > 0) return;

    const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;

    const job: Job = {
      slug: initialJob?.slug ?? slugify(data.title),
      title: data.title.trim(),
      category: data.category,
      jobType: data.jobType,
      location: data.location.trim(),
      summary: data.summary.trim(),
      description: data.description.trim(),
      responsibilities: toLines(data.responsibilities),
      qualifications: toLines(data.qualifications),
      // The input is in the admin's own time zone; send an absolute instant.
      closesAt: new Date(data.closesAt).toISOString(),
      status: data.status as JobStatus,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateJob(job.slug, job);
        router.push(`/admin/careers?updated=${job.slug}`);
      } else {
        const created = await createJob(job);
        router.push(`/admin/careers?created=${created.slug}`);
      }
    } catch (error) {
      setFormError(
        error instanceof ApiError && error.status === 409
          ? "A job with this title already exists. Change the title slightly."
          : "Could not save this job. Please try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-5">
      <AdminTextInput
        label="Job Title"
        name="title"
        placeholder="Travel and Study Abroad Officer"
        defaultValue={initialJob?.title}
        onBlur={handleBlur}
        state={fieldState("title")}
        error={fieldErrors.title}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <AdminSelect
          label="Category"
          name="category"
          defaultValue={initialJob?.category ?? ""}
          onBlur={handleBlur}
          state={fieldState("category")}
          error={fieldErrors.category}
        >
          <option value="" disabled>
            Select a category
          </option>
          {jobCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          label="Job Type"
          name="jobType"
          defaultValue={initialJob?.jobType ?? jobTypes[0]}
          onBlur={handleBlur}
          state={fieldState("jobType")}
          error={fieldErrors.jobType}
        >
          {jobTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </AdminSelect>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <AdminTextInput
          label="Location"
          name="location"
          defaultValue={initialJob?.location ?? defaultJobLocation}
          onBlur={handleBlur}
          state={fieldState("location")}
          error={fieldErrors.location}
        />
        <AdminTextInput
          label="Applications Close"
          name="closesAt"
          type="datetime-local"
          defaultValue={initialJob ? toDateTimeLocalValue(initialJob.closesAt) : undefined}
          onBlur={handleBlur}
          state={fieldState("closesAt")}
          error={fieldErrors.closesAt}
        />
      </div>

      <AdminTextArea
        label="Summary"
        name="summary"
        rows={2}
        placeholder="One or two sentences shown on the careers list."
        defaultValue={initialJob?.summary}
        onBlur={handleBlur}
        state={fieldState("summary")}
        error={fieldErrors.summary}
      />
      <AdminTextArea
        label="Description"
        name="description"
        rows={6}
        placeholder="What the role is about and who it is for."
        defaultValue={initialJob?.description}
        onBlur={handleBlur}
        state={fieldState("description")}
        error={fieldErrors.description}
      />
      <div>
        <AdminTextArea
          label="Responsibilities"
          name="responsibilities"
          rows={6}
          defaultValue={initialJob?.responsibilities.join("\n")}
          onBlur={handleBlur}
          state={fieldState("responsibilities")}
          error={fieldErrors.responsibilities}
        />
        <p className="mt-1.5 text-xs text-text-tertiary">One per line. Each line becomes a bullet.</p>
      </div>
      <div>
        <AdminTextArea
          label="Qualifications"
          name="qualifications"
          rows={6}
          defaultValue={initialJob?.qualifications.join("\n")}
          onBlur={handleBlur}
          state={fieldState("qualifications")}
          error={fieldErrors.qualifications}
        />
        <p className="mt-1.5 text-xs text-text-tertiary">One per line. Each line becomes a bullet.</p>
      </div>

      <AdminSelect label="Status" name="status" defaultValue={initialJob?.status ?? "draft"}>
        <option value="draft">Draft (hidden from the careers page)</option>
        <option value="published">Published (visible until the closing date)</option>
      </AdminSelect>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Job"}
      </Button>
    </form>
  );
}
