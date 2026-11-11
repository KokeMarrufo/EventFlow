# Design Reference — downtownmission.com (Nov 2026 snapshot)

Pulled from the live site to approximate Downtown Mission's visual identity
for the EventFlow dashboard. **Not an official brand guide** — confirm with
the Mission if this ships beyond an internal pilot.

## Palette

| Token | Hex | Used for |
|-------|-----|----------|
| `navy` | `#142036` | Header, hero backgrounds, body headings |
| `sky` | `#29ABE0` | Secondary CTAs, info banners, link accents |
| `gold` | `#F0B94D` | Primary highlight / "donate"-style emphasis, outlined callouts |
| `surface` | `#FFFFFF` | Cards |
| `background` | `#F7F9FC` | Page background |

## Type

Headings on the live site use a rounded geometric sans (letterforms like
"Baloo"/"Quicksand"/"Comfortaa"). We use **Baloo 2** for headings/display
text and **Inter** for body text as a close, freely-licensed approximation
— see `src/app/layout.tsx` and the `--font-display` token in `globals.css`.

## Layout cues carried into EventFlow

- Rounded-pill outline buttons for secondary actions, solid filled pill for
  the primary action (mirrors their "DONATE TODAY" / nav CTA treatment).
- Diagonal accent lines / angled dividers between navy hero sections and
  white content (kept subtle — EventFlow is an internal ops tool, not a
  donation site).
- Large bold stat callouts in overlapping rounded cards (seen on their
  `/impact` page) — reused for the per-event net/cost/revenue summary tiles.
- Light, high-contrast content sections (white/near-white) between colored
  bands, so dense tabular data stays readable.

## What we deliberately did not copy

- Donation/CTA-heavy marketing tone — EventFlow is an internal staff tool.
- Public-facing imagery (photos of clients) — not appropriate for an
  internal financial reporting tool.
