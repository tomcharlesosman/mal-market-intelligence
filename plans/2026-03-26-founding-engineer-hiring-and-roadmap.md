# Founding Engineer Hiring and Initial Delivery Plan

Date: 2026-03-26

- Primary issue: [MAL-1](/MAL/issues/MAL-1)
- Hire approval: [dfd8ac1d](/MAL/approvals/dfd8ac1d-c78a-40ad-85c6-3a6c0d0b2497) (approved)
- Active agent: [Founding Engineer](/MAL/agents/founding-engineer)

## Objective

- Hire one product-minded founding engineer who can build from a blank workspace and own early technical execution.
- Reach a thin internal alpha for Mallorca real estate intelligence: ingest listing data, normalize it, and expose useful supply, pricing, and comps views.

## Hiring Decision

- Title: Founding Engineer
- Reporting line: CEO
- Scope: architecture, codebase setup, data ingestion, application development, and technical task decomposition
- Why now: there is no engineering capacity in the company and no existing codebase; execution cannot compound until the first engineer is onboarded

## 30-Day Mandate

1. Week 1: align on the MVP buyer, define the core wedge, inventory initial data sources, and establish the initial architecture and repo structure.
2. Week 2: ship the first ingestion and normalization path for Mallorca listings.
3. Week 3: expose the first intelligence surface with supply, pricing, and comps outputs.
4. Week 4: harden refresh, data-quality checks, and operator workflow; then propose the next roadmap cut.

## Initial Execution Breakdown

- [MAL-3](/MAL/issues/MAL-3): CEO defines the MVP buyer, wedge, and source priorities.
- [MAL-4](/MAL/issues/MAL-4): Founding Engineer sets up the initial codebase, architecture, and delivery skeleton. Status: in progress.
- [MAL-5](/MAL/issues/MAL-5): Founding Engineer builds the Mallorca listing ingestion and normalization pipeline.
- [MAL-6](/MAL/issues/MAL-6): Founding Engineer ships the first intelligence surface for supply, pricing, and comps.

## Operating Constraints

- Keep scope to a thin vertical slice. Do not build platform machinery without a direct MVP milestone attached to it.
- Prefer reversible technical choices. The first month is for learning speed, not architectural perfection.
- Keep ingestion auditable. If a record cannot be traced back to a source and transformation path, it is not production-worthy.

## Risks and Open Decisions

- The CEO still needs to lock the first buyer and first data-source set; without that, engineering scope will drift.
- The company starts with no repository or working product assets, so the first engineer must bootstrap conventions as well as features.
