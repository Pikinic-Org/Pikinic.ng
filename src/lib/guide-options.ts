// Answer choices for the study abroad sign-up form. Shared by the form (client)
// and the API schema (server) so the two can never drift apart. The stored
// value is the label itself, which keeps the admin table and CSV readable.

// Step one: where the person is right now. Ordered for a graduate audience,
// with the older WAEC-era options kept so existing leads still match.
export const guideStages = [
  "Current undergraduate",
  "University graduate (interested in a master's)",
  "NYSC corps member",
  "Current postgraduate student",
  "WAEC result in hand",
  "Current SS3 student",
  "Secondary school graduate",
  "Parent or guardian",
] as const;

// Step two (optional profile).
export const guideQualifications = [
  "Secondary school (WAEC)",
  "OND or HND",
  "Bachelor's degree",
  "Master's degree",
  "Other",
] as const;

export const guideCountries = [
  "United Kingdom",
  "Canada",
  "United States",
  "Australia",
  "Germany and Europe",
  "Not sure yet",
] as const;

export const guideIntakes = ["January 2027", "September 2027", "2028 or later", "Not sure yet"] as const;

export const guideFunding = [
  "Myself",
  "Family or sponsor",
  "A scholarship",
  "A study loan",
  "Not sure yet",
] as const;

// Event tags come from the QR code (?src=growth-conference-ui). Anything that
// does not look like a slug falls back to the default rather than being stored.
export const GUIDE_SOURCE_PATTERN = /^[a-z0-9][a-z0-9_-]{0,59}$/i;
export const GUIDE_DEFAULT_SOURCE = "website";
