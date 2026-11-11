# Team Brief — Downtown Mission / EventFlow

Placeholder summary doc referenced in §9 ("Team brief: Downtown Mission
project — scope buckets, steps, risks"). Expand this from the full Progress
Report (`docs/artifacts/SPLASH_Progress_Report_01.md` once exported) as the
project proceeds.

## Target organization

Downtown Mission (Windsor, Ontario) — development / fundraising operations.

## Problem (working hypothesis)

The Mission runs roughly one fundraising event/campaign per month and
cannot quickly see which events made money after costs, because event
budgets, donations (DonorPerfect) and accounting (Sage) sit in separate
systems and must be reconciled by hand. **Not yet confirmed by front-line
staff.**

## Scope buckets (§6.1)

| Bucket | Contents |
|--------|----------|
| Must | Per-event cost, revenue and net; total across events; every figure traceable to a source file |
| Maybe | Aggregate donor counts per event; simple event comparison; live API connection; internal event task manager (only if API access confirmed + core report verified) |
| Not now | Donor-level detail; forecasting; a new fundraising platform |

## Team / roles (§5.1)

| Member | Responsibility |
|--------|-----------------|
| Juan Jorge Marrufo Algarra | Stakeholder contact, coordination, decision log |
| Jesus Manuel Ramirez Mendez | Data adapters, internal model, validation |
| Peng Guo | Data adapters, reconciliation tests |
| Meng Wang | Report/interface, baseline measurement, evidence collection |

## Risks (see also §7, §6.1 "conditions that would justify changing scope")

- Staff do not confirm the pain is real/significant.
- Sample (anonymized) export data cannot be obtained.
- Event tagging is too inconsistent to match revenue to events reliably.
- No one at the Mission can own/maintain the tool after Dec 9.

## Go/no-go gate

~Nov 14, 2026 — requires staff confirmation, real sample data, and a
measurable baseline. See `docs/success-thresholds-PLACEHOLDER.md`.
