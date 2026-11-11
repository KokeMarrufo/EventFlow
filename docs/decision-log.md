# Decision Log

Traceability for significant decisions, per §4.3 of Progress Report 01. Each
entry: context, options considered, decision, evidence used, who decided,
date, and what would make us revisit it.

| ID | Decision | Alternatives / rationale | Evidence | Date | Revisit if |
|----|----------|---------------------------|----------|------|------------|
| D1 | Event-reporting problem instead of a gift-in-kind intake app | A mobile intake app for handwritten receipts likely duplicates DonorPerfect Mobile + batch entry (S3) | S3 (DonorPerfect public docs) | TBD — pending next stakeholder appointment | We learn paper receipts persist for a reason the existing tools don't cover |
| D2 | Work from exported files, not live integrations | API access is plan-dependent and unconfirmed; final claims must not depend on it | S1 (interview) | TBD | Mission confirms API access on their actual plan |
| D3 | No donor-level data in initial scope | Privacy duties; DonorPerfect already holds donor records | S1 | TBD | Staff require donor-level detail for the report to be useful |
| D4 | Treat n8n as optional glue only | Core matching/validation logic belongs in tested code; hosting + maintenance burden | S4 | TBD | A no-code orchestration need emerges that outweighs the maintenance cost |

> **Placeholder status:** dates are TBD pending the next staff appointment
> (see §8.3). Add new rows here as decisions are made — do not edit past
> rows after the fact; add a follow-up row instead.
