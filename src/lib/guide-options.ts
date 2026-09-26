// Answer choices for the free WAEC guide form. Shared by the form (client) and
// the API schema (server) so the two can never drift apart. The stored value is
// the label itself, which keeps the admin table and CSV export readable.

export const guideStages = [
  "Current SS3 student",
  "WAEC result in hand",
  "Secondary school graduate",
  "Current undergraduate",
  "Parent or guardian",
] as const;

// Event tags come from the QR code (?src=lagos-waec-talk). Anything that does
// not look like a slug falls back to the default rather than being stored.
export const GUIDE_SOURCE_PATTERN = /^[a-z0-9][a-z0-9_-]{0,59}$/i;
export const GUIDE_DEFAULT_SOURCE = "website";
