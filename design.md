# Pikinic Design System

The homepage sets the standard, and every other page should reuse its patterns rather than invent new ones.

## 1. Sources

- **Brand assets:** fonts, colours, the pattern and the logo come from the [brand folder on Google Drive](https://drive.google.com/drive/folders/1aqBm27RExCFiInuA0gk20Zj3qrhcGzwW).
- **Motion reference:** GSAP (ScrollTrigger, SplitText). The services section follows GSAP's "Slides Pinning, Overscroll" demo.
- **Visual reference:** Awwwards and Pinterest. Only use them for components that need a full redesign. If a font, colour or corner change fixes a component, don't redesign it.

## 2. Rules

- **Colour split, 60 / 30 / 10.** 60% `#f6f4ef` off-white, 30% `#111111` text plus `#002f16` deep-green sections, 10% `#43c074` brand green.
- **Spacing, gaps and radius** follow shadcn conventions (4px grid, mostly `gap-3/4/6`, card padding `p-6`, `md:p-8`–`p-10`). Don't install or use shadcn itself.
- **Sentence case everywhere.** No all-caps headlines, labels, buttons or nav.
- **Never add these:** taglines or small labels above headings, coloured left or right borders on cards, AI-style decorative icons (sparkles, glowing blobs), the old pathway motif, the old square-frame grid, golden or warm paper tones, sharp 2px corners.
- **Real content only.** No invented stats, testimonials, people or destinations.

## 3. Tokens

| Role | Value | Token |
|---|---|---|
| Page background (60%) | `#f6f4ef`, the brand's own light neutral (also the logo's wordmark colour) | `neutral-50` / `background-primary` |
| Cards | `#ffffff` | `surface-primary` |
| Text and dark sections (30%) | `#111111`, `#002f16` | `neutral-900`, `green-900` |
| Accent (10%) | `#43c074` | `green-500`, always with dark text (white on it fails contrast) |
| Green text on light backgrounds | `#227a48` | `green-700` |
| Service accents | Study abroad `#2577ef`, Travel and tours `#f58634`, Stay and ride `#ffd93b`, Finance `#ff4d4d` | `blue-500`, `orange-500`, `yellow-500`, `red-500` |

- **Fonts:** Grift for headings (400–700), Nexa for body (400, 500, 700). Both load locally from `src/app/fonts/` via `src/app/fonts.ts`. Nexa has metric overrides (`ascent-override: 95%`, `descent-override: 25%`) so text sits centred in buttons and pills. Without them it sits high.
- **Radius:** `sm` 4, `md` 6, `lg` 8, `xl` 10, `2xl` 12. Buttons use `lg` (8px), cards and panels `2xl` (12px), images inside cards `xl` (10px). Use `rounded-full` only for avatars, icon circles and inline photos.
- **Type scale:** page titles `text-5xl` → `lg:text-8xl`, section titles `text-4xl` → `md:text-6xl/7xl`, all `font-semibold leading-[1.02–1.05] tracking-tight`. One accent word per headline, in `green-700` (or `green-500` on dark backgrounds).

## 4. Components

- **Button** (`src/components/ui/button.tsx`): text plus a small inline arrow. The arrow never sits in its own container, and it grows on hover. Variants: `primary` (green-500, dark text), `secondary` (outline), `inverse` (white, for dark or colour sections). Sizes: `sm` h-8/px-3, `md` h-10/px-5, `lg` h-12/px-6.
- **Inline photo** (`src/components/ui/inline-photo.tsx`): a small rounded-full photo set into a line of display type. Use it in page titles and statement paragraphs, at most three per block.
- **Brand pattern** (`src/components/ui/brand-pattern.tsx`): the pattern file from the identity pack, `public/brand/pattern.svg`, recoloured tone-on-tone. Every ring is a shade between `#002f16` and `#0c4f2c` instead of the original bright-green gradient, so it shows at full opacity without being vivid. Don't redraw it, fade it or combine it with other shapes. Use it only on `green-900` surfaces: behind the call-to-action and on the highlighted stats card (Agent fees charged).
- **Cards:** white (`surface-primary`) on the off-white page, `rounded-2xl`, no borders and no shadows.
- **Deep-green cards and the bottom call-to-action block** (the call-to-action, the highlighted stat, the About mission and founder cards, the Travel & Tours package, flight-deal and partnership cards) all use `DeepGreenBackdrop` from `src/components/ui/brand-pattern.tsx`: the brand pattern on `green-900` with a dark gradient rising from the bottom (`neutral-900` 90% → 25% → transparent), so text at the bottom stays legible. This is the one place a gradient is allowed.
- **Icons:** 24px line icons, `stroke-width 1.5`, round caps, inside a `size-12` `rounded-full` `bg-green-500/15` circle (see About → Values).
- **Full-bleed dark blocks** (call-to-action, footer, team): inset by `px-3 md:px-4` from the viewport edge, with `rounded-2xl` corners.

## 5. Page patterns (from the homepage)

1. **Hero:** left-aligned three-line title (`clamp(2.5rem, 5.5vw, 5.75rem)`), each line revealed from behind a mask. The last line cycles through the outcomes, one per service (destination, degree, new home, fresh start), with a masked vertical flip. Subcopy and a single primary button sit bottom-right beside the short last line. Below it sits **one image** in a stage pinned to the viewport. It starts framed (`inset 6% 5%`, 12px corners), opens to full bleed as you scroll, pushes in slightly, then releases into the next section.
2. **Statement:** a large paragraph in the heading font with inline photos. The second half is set in `text-tertiary`.
3. **Services:** stacked full-screen panels, one per service, each in its accent colour. Each panel pins at `bottom bottom`, then scales to 0.7 and fades while the next panel slides over it (`pinSpacing: false`). The last panel scrolls normally. Below `md` they're a plain stack of cards.
4. **Stats and testimonials:** white cards on a 4-column and 3-column grid.
5. **Call-to-action:** inset `green-900` block with the brand pattern, a centred title and `primary` + `inverse` buttons.

Inner pages open with a statement-style title (with one inline photo) and reuse the same cards, dark blocks and call-to-action.

## 6. Motion

- All motion uses GSAP (`gsap.matchMedia`) and runs only under `prefers-reduced-motion: no-preference`. The static layout is the fallback.
- Anything that changes layout height above a pinned section (font swap, late content) must be followed by `ScrollTrigger.refresh()`. The hero does this on `document.fonts.ready`.
- `ScrollReveal` (fade and rise on entering the viewport) is fine for ordinary blocks. Keep pinned or scrubbed effects to the hero and services.

## 7. Open items

- **Font licences:** the local Grift zip is a personal-use demo, and the brand sheet specifies Nexa Text (the zip has Nexa). Buy commercial licences before launch.
- **Photography:** the service images are low resolution (about 700px). Replace them with graded, consistent photos, with subjects placed to suit each layout (centred for the hero's full-bleed crop).
