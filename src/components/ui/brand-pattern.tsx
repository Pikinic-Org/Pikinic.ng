import Image from "next/image";
import { cn } from "@/lib/utils";

// The brand pattern from the identity pack (public/brand/pattern.svg), recoloured
// tone-on-tone: every ring is a shade between #002f16 and #0c4f2c, so it reads
// clearly at full opacity without being vivid. Only for green-900 surfaces.
export function BrandPattern({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/pattern.svg"
      alt=""
      aria-hidden
      fill
      sizes="100vw"
      className={cn("pointer-events-none object-cover", className)}
    />
  );
}

// The standard backdrop for a deep-green card: the pattern on green-900 with a
// dark gradient rising from the bottom so text over it stays legible. The card
// itself needs `relative isolate overflow-hidden`.
export function DeepGreenBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("absolute inset-0 -z-10 bg-green-900", className)}>
      <BrandPattern />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/90 via-neutral-900/25 to-transparent" />
    </div>
  );
}
