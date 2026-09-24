import Image from "next/image";

// A small photo set into a line of display type, sized to the cap height.
export function InlinePhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="relative mx-1 inline-block h-[0.8em] w-[1.6em] translate-y-[0.06em] overflow-hidden rounded-full align-baseline">
      <Image src={src} alt={alt} fill sizes="160px" className="object-cover" />
    </span>
  );
}
