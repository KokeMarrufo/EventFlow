# Design Reference — "Mission Operations & Data Hub" (Nov 2026)

**Current system, in force.** Provided by the team as a dedicated design
system for an internal ops/data tool (distinct from downtownmission.com's
public marketing site — see "Superseded" below). Not an official Mission
brand guide — confirm before this ships beyond an internal pilot.

## Palette

| Token | Hex | Used for |
|-------|-----|----------|
| `navy` | `#0F2441` | Structural chrome, heavy headings, data labels |
| `primary` | `#00458B` | CTAs, active nav, section identifiers, focus rings |
| `mission-sky` | `#0088CC` | Links, info banners, progress bars |
| `crimson` | `#D9383A` | Destructive actions, "down"/error states |
| `success` / `warning` | `#1E7E45` / `#C05621` | Status semantics (ahead vs. incomplete) |
| `surface-container-*` | `#FFFFFF`–`#E1E3E4` | Card/canvas tonal layering (see `globals.css`) |

Status badges and chips are **text + background color only, no dot/icon** —
the color and label alone carry the state (`src/components/status-badge.tsx`).

## Type

**Plus Jakarta Sans** (display/headings, 600–800 weight) + **Inter**
(body/data) — see `src/app/layout.tsx`. Numeric columns (currency, counts)
use `.tabular-nums` so digits don't jitter.

## Layout patterns adopted

- KPI telemetry row: 4 cards, each an icon chip + label + big number +
  subtext, optional thin progress bar (`stat-tile.tsx`).
- Dense, searchable/filterable data tables with text-only status chips, a
  "Files" disclosure instead of inline filename badges.
- A real system-wide audit trail ("Recent imports") separate from
  per-event totals (`recent-imports.tsx`, `lib/reports#getRecentImports`).
- Per-entity bento-style detail cards (cost/revenue-by-file breakdown, data
  quality notes) instead of one flat line-items table.
- lucide-react icons (not the reference's Material Symbols font ligatures —
  more reliable in a compiled React app, same visual language).

## What we deliberately did not copy

- The reference mockup's actual *content* (food poundage, volunteer
  rosters, GPS trucks, fake staff names/photos, fictional "live connector"
  statuses) — that describes a food-bank/volunteer-logistics product, not
  EventFlow's per-event financial reconciliation scope. Every number this
  app shows is real and derived from `lib/reports`/`lib/tasks`, never a
  static mockup figure.
- Donation/CTA-heavy marketing tone — EventFlow is an internal staff tool.

## Superseded

An earlier pass of this file approximated downtownmission.com's public
marketing palette (navy `#142036` / sky `#29ABE0` / gold `#F0B94D`, Baloo 2
font). That was replaced wholesale by the system above per direct
team feedback that the marketing-site look read as too simple for an
internal ops tool. See git history if that palette is ever needed again.
