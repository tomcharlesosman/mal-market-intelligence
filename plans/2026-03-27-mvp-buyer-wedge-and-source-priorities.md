# Mallorca MVP Buyer, Wedge, and Source Priorities

Date: 2026-03-27

- Primary issue: [MAL-3](/MAL/issues/MAL-3)
- Unblocks: [MAL-5](/MAL/issues/MAL-5), [MAL-6](/MAL/issues/MAL-6)

## Decision

- First buyer: boutique buyer's agents and small acquisition teams serving international buyers in Mallorca's premium resale market.
- Initial geography: Palma plus the southwest corridor first, especially Calvia and Andratx.
- Initial inventory scope: residential sale listings only. Exclude rentals, commercial, island-wide long tail, and consumer search UX.

## Why This Buyer

- They already stitch together fragmented supply across portals and broker sites by hand.
- They monetize speed and coverage, so timely listing-change intelligence is more valuable than perfect long-run valuation on day one.
- A narrow B2B workflow is easier to sell and easier to support than a broad consumer product.
- The current engineering stack is already oriented around auditable listing ingestion, which fits a supply-monitoring product better than a marketplace or transaction system.

## Product Wedge

The first wedge should be an acquisition radar, not a general search portal.

Core outputs:

- net-new listing alerts in target municipalities and price bands
- price-cut and relist detection
- duplicate collapse across sources
- neighborhood comps briefs built from current asking inventory
- source-backed evidence for every record and change event

This gives the first buyer a faster answer to "what changed in my market this week?" without forcing the product to solve full valuation, CRM, or consumer discovery.

## Source Priorities

### Strategic source stack

1. Idealista sale listings in the target municipalities.
2. Fotocasa sale listings in the same slice.
3. Hand-picked Mallorca broker sites for premium inventory and local exclusives.
4. Public reference data for enrichment and validation, not primary alerting.

### Immediate implementation sequence

1. Ship one live reachable source fast to prove the end-to-end connector on real data.
2. Add a browser-backed or licensed path for Idealista.
3. Add Fotocasa once the anti-bot handling pattern is working.
4. Layer broker sites where premium supply is underrepresented on portals.
5. Add public reference datasets for benchmarks and location hygiene.

### Named sources checked on 2026-03-27

- Idealista: reachable homepage, but direct listing requests returned HTTP 403 behind DataDome.
- Fotocasa: direct requests returned HTTP 403.
- pisos.com: reachable over HTTP 200 and useful as a lower-friction proof source if portal anti-bot blocks the first sprint.
- Engel & Volkers Mallorca: reachable and relevant for premium inventory.
- Pollentia Properties: reachable and relevant for local premium inventory.
- Mallorca Property Centre: reachable and relevant for local premium inventory.
- Registradores de Espana, INE, and Catastro: reachable as public reference sources for lagging benchmarks, official geography, and enrichment.

## What To Build Next

- [MAL-5](/MAL/issues/MAL-5) should optimize for change tracking, dedupe, and source evidence, not raw source count.
- [MAL-6](/MAL/issues/MAL-6) should expose a simple operator view around new supply, price moves, and neighborhood comps for Palma and the southwest corridor.
- Do not spend early cycles on AVMs, rental yield models, or island-wide coverage before this workflow is in use.

## Non-Goals For The First Cut

- direct-to-consumer home search
- rentals and holiday lets
- commercial real estate
- closed-transaction accuracy as a launch requirement
- broad island coverage before the Palma and southwest slice is useful
