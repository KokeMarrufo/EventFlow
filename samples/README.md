# Sample Import Files

**Synthetic test data only — not from Downtown Mission.** Real anonymized
exports have not been obtained yet (see `docs/operational-readiness.md`).
These exist purely so `/import` can be exercised end-to-end before real
samples arrive, matching the column assumptions documented at the top of
each adapter in `src/lib/adapters/`.

Upload them at `/import`, picking the matching **source type** in the form:

| File | Source type | Event | Declared total row | Expected result |
|------|-------------|-------|---------------------|------------------|
| `event_budget_spring_gala.csv` | Event Budget | Spring Gala | `-5000` | 4 cost line items, reconciles exactly |
| `donorperfect_spring_gala.csv` | DonorPerfect | Spring Gala | `17000` | 1 aggregated revenue line item, reconciles exactly |
| `sage_spring_gala.csv` | Sage | Spring Gala | `-400` | 2 incidental cost line items (fees not in the original budget), reconciles exactly |
| `event_budget_with_errors.csv` | Event Budget | Holiday Appeal | *(none)* | 1 good row + 4 validation errors (missing amount, unparsable date, missing event tag, duplicate row) — demonstrates the "bad data produces a clear error, never a silently wrong number" requirement |

## Try it

1. Import all three `*_spring_gala.csv` files (any order) with source type
   matching the filename.
2. Open the "Spring Gala" event on `/events` — cost, revenue and net should
   reflect all three files combined ($5,400 cost, $17,000 revenue, $11,600
   net), each line item traceable to its filename + row.
3. Import `event_budget_with_errors.csv` as **Event Budget** and confirm
   the import result shows 1 row parsed and 4 validation errors listed.
4. Open the "Spring Gala" event detail page and check the **Cost by
   category** / **Revenue by category** charts — they should show Venue,
   Catering, Decor & Signage and Marketing & Printing (cost) plus Ticket
   Sales (revenue), each bar driven by the `category`/`fund`/`account`
   column below, not a static mockup number.

Amounts use the adapters' sign convention (negative = cost) rather than a
`kind` column, to also exercise that fallback path — both are documented
as valid in each adapter's header comment.

## Category columns

Each source models a real-world grouping concept, read into
`LineItem.category` and charted on both the event detail and events-list
pages:

| Source | Column | Modeled on |
|--------|--------|------------|
| Event Budget | `category` | How nonprofit event budgets are typically organized (Venue, Catering, Decor & Signage, Marketing & Printing, AV/Equipment, Staffing, Insurance) |
| DonorPerfect | `fund` | DonorPerfect's real Fund/Campaign/Appeal fields (Ticket Sales, Sponsorship, Individual Gifts, Corporate Match, Auction/Raffle) |
| Sage | `account` | The GL account name itself (e.g. "Expense - Bank Fees") — Sage/GL exports are already organized by chart-of-accounts entries, so no separate column is needed |
