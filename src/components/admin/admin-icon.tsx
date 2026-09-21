import type { ReactNode } from "react";

type AdminIconKey =
  | "dashboard"
  | "blog"
  | "flight"
  | "deal"
  | "package"
  | "webinar"
  | "booking"
  | "consultant"
  | "media"
  | "logout"
  | "plus"
  | "pencil"
  | "trash"
  | "check"
  | "close"
  | "chevron-down";

const paths: Record<AdminIconKey, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="5" rx="1" />
      <rect x="13" y="11" width="8" height="10" rx="1" />
      <rect x="3" y="14" width="8" height="7" rx="1" />
    </>
  ),
  blog: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4" />
      <path d="M9 12h6M9 16h6" />
    </>
  ),
  flight: (
    <path d="M10.4499 8.55483L0.00345457 12.2505L8.16842 20.4155L11.8641 9.96905L10.4499 8.55483ZM11.3147 9.10424C13.3975 11.187 16.7744 11.187 18.8572 9.10424C20.94 7.02145 20.94 3.64457 18.8572 1.56177C16.7744 -0.521025 13.3975 -0.521024 11.3147 1.56177C9.2319 3.64457 9.2319 7.02145 11.3147 9.10424ZM10.4499 9.96905L11.157 10.6762L15.793 6.04012L15.0859 5.33301L14.3788 4.6259L9.74279 9.26194L10.4499 9.96905Z" fill="currentColor" stroke="none" />
  ),
  package: (
    <>
      <path d="M3 8l9-5 9 5-9 5-9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </>
  ),
  deal: (
    <>
      <path d="M3 11.5V4h7.5L21 14.5 13.5 22 3 11.5Z" />
      <circle cx="8" cy="8.5" r="1.5" />
    </>
  ),
  webinar: (
    <>
      <rect x="3" y="5" width="14" height="11" rx="1" />
      <path d="M17 9.5 21 7v9l-4-2.5" />
      <circle cx="10" cy="10.5" r="2.25" />
    </>
  ),
  booking: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="1.5" />
      <path d="M3 9h18M8 2v4M16 2v4" />
      <path d="M8 13.5l2 2 4-4.5" />
    </>
  ),
  consultant: (
    <>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 5.5a3 3 0 0 1 0 5.5M18 14.5c1.9.8 3 2.6 3 5.5" />
    </>
  ),
  media: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <circle cx="8.5" cy="9.5" r="1.75" />
      <path d="M3 16l5-5 4 4 3-3 6 6" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  logout: (
    <>
      <path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" />
      <path d="M9 12h12M17 8l4 4-4 4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  pencil: (
    <>
      <path d="M4 20h4L18.5 9.5a2.121 2.121 0 0 0-3-3L5 17v3Z" />
      <path d="M14 6l4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  check: <path d="M5 12l5 5L20 7" />,
  "chevron-down": <path d="M6 9l6 6 6-6" />,
};

export function AdminIcon({ icon, className }: { icon: AdminIconKey; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[icon]}
    </svg>
  );
}
