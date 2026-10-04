"use client";

import { useState } from "react";

// Sits inside clickable table rows, so it must swallow the click rather than
// let the row link navigate.
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard blocked (e.g. insecure context); nothing useful to do.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      title={copied ? "Copied" : `Copy ${label}`}
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] transition-colors hover:bg-neutral-900/[0.08] ${
        copied ? "text-green-700" : "text-text-tertiary"
      }`}
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
          <path d="M5 12l5 5L20 7" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V6a2 2 0 0 1 2-2h9" />
        </svg>
      )}
    </button>
  );
}
