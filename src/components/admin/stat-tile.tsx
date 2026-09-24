import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatTileGrid({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-1 border-l border-t border-border-primary sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </dl>
  );
}

export function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex h-32 flex-col justify-center gap-2 overflow-hidden border-b border-r border-border-primary px-6",
        accent ? "bg-green-800" : ""
      )}
    >
      <dd
        className={cn(
          "relative text-3xl font-bold tracking-tight",
          accent ? "text-neutral-0" : "text-text-primary"
        )}
      >
        {value}
      </dd>
      <dt
        className={cn(
          "relative text-xs font-semibold uppercase tracking-widest",
          accent ? "text-neutral-0/70" : "text-text-tertiary"
        )}
      >
        {label}
      </dt>
    </div>
  );
}
