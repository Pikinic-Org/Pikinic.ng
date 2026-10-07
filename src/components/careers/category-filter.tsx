"use client";

// A plain GET form around a select: it submits to /careers?category=..., so the
// filter is a shareable link and still works if JavaScript is off (the button
// below is only shown then; with JavaScript the select submits on change).
export function CategoryFilter({
  options,
  value,
}: {
  options: { label: string; value: string }[];
  value: string;
}) {
  return (
    <form action="/careers" method="get" className="flex w-full items-center gap-3 sm:w-64">
      <div className="relative w-full">
        <select
          name="category"
          aria-label="Filter roles by category"
          defaultValue={value}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className="h-12 w-full appearance-none rounded-lg bg-surface-primary px-4 pr-11 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
        >
          <option value="">All categories</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-text-secondary"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      <noscript>
        <button type="submit" className="h-12 rounded-lg bg-green-500 px-5 text-sm font-medium text-neutral-900">
          Filter
        </button>
      </noscript>
    </form>
  );
}
