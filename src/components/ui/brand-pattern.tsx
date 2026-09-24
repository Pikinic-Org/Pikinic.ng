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
