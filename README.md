# EventFlow

A small tool for **Downtown Mission** (Windsor, Ontario) that reads
exported files (CSV/Excel) from event budgets, DonorPerfect (donations) and
Sage (accounting), and produces a **per-event report of cost, revenue and
net**, plus a total across events — with every figure traceable back to a
source file and row.

> **Status: early pilot / draft.** No live integrations, no donor-level
> personal data. See `docs/` for the project's decision log, evidence log,
> and open questions — this matches **SPLASH Progress Report 01**
> (Nov 10, 2026). Success thresholds and the go/no-go decision are not yet
> final; see `docs/success-thresholds-PLACEHOLDER.md`.

## Why

The Mission runs roughly one fundraising event/campaign a month. Event
budgets, donations and accounting currently live in separate systems, so
seeing whether an event actually made money after costs means gathering and
reconciling data by hand. This is a **working hypothesis**, not yet
confirmed by front-line staff (see `docs/evidence-log.md`).

## Scope (§6.1 of the progress report)

| Bucket | Contents |
|--------|----------|
| Must | Per-event cost/revenue/net; total across events; traceability to source file |
| Maybe | Donor counts per event; event comparison; live API; task manager |
| Not now | Donor-level detail; forecasting; a new fundraising platform |

## Architecture

```
Source files (CSV/XLSX)
  event budget / DonorPerfect export / Sage export
        │
        ▼
  lib/adapters/*        — one adapter per source, normalizes to LineItem[]
        │
        ▼
  lib/reports/*         — matches by event, reconciles vs. declared totals
        │
        ▼
  db/schema.ts (Postgres via Drizzle)
        │
        ▼
  src/app/api/*          — events list, event detail, import
        │
        ▼
  src/app/(dashboard)/*  — staff-facing report UI
```

Shared contract types live in `lib/types.ts` — keep backend (adapters/API)
and frontend (dashboard) in sync through that file, not ad hoc shapes.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Postgres + Drizzle ORM (local via `docker-compose up -d`, or a Vercel
  Marketplace Postgres/Neon database in production)
- Clerk for staff authentication (placeholder until a Mission-owned Clerk
  project exists — auth is bypassed in dev when keys are unset)
- Vercel for hosting/preview deployments

## Getting started

```bash
cp .env.example .env.local
docker compose up -d        # local Postgres
npm install
npm run db:push             # apply schema (once lib/adapters work lands)
npm run dev
```

Open http://localhost:3000.

## Project docs

- `docs/decision-log.md` — D1–D4 and future decisions
- `docs/evidence-log.md` — observations vs. hypotheses (E1–E8)
- `docs/team-brief.md` — scope, roles, risks
- `docs/success-thresholds-PLACEHOLDER.md` — go/no-go gate (~Nov 14, 2026)
- `docs/operational-readiness.md` — staff meeting, sample data, permissions
- `docs/design-reference.md` — Downtown Mission brand cues used in the UI
- `docs/artifacts/` — interview transcript & follow-up email placeholders

## Privacy

No donor names or other donor-level personal data are stored. DonorPerfect
exports must be aggregated per event before they enter the system (see D3
in the decision log).
