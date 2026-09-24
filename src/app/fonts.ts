import localFont from "next/font/local";

// Brand typefaces: Grift for headings, Nexa for body copy.
export const grift = localFont({
  variable: "--font-grift",
  display: "swap",
  src: [
    { path: "./fonts/grift-regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/grift-medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/grift-semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/grift-bold.woff2", weight: "700", style: "normal" },
  ],
});

export const nexa = localFont({
  variable: "--font-nexa",
  display: "swap",
  // Nexa's own metrics leave far more room below the baseline than above the
  // caps, so text sits high in buttons and pills. These overrides centre the
  // cap height in the line box.
  declarations: [
    { prop: "ascent-override", value: "95%" },
    { prop: "descent-override", value: "25%" },
    { prop: "line-gap-override", value: "0%" },
  ],
  src: [
    { path: "./fonts/nexabook.woff2", weight: "400", style: "normal" },
    { path: "./fonts/nexaregular.woff2", weight: "500", style: "normal" },
    { path: "./fonts/nexabold.woff2", weight: "700", style: "normal" },
  ],
});
