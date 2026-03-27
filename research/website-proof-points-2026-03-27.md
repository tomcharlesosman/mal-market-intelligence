# Website Proof Points

Date: 2026-03-27
Issue: [MAL-8](/MAL/issues/MAL-8)

## Scope

- Audience: boutique buyer's agents and small acquisition teams serving premium-resale buyers in Mallorca.
- Geography for launch messaging: Palma plus the southwest corridor.
- Goal: provide source-backed website claims, market examples, pain points, and caveats.

## Workflow Note

- Intended tool: Firecrawl.
- Runtime blocker: `firecrawl` and `npx firecrawl` were unavailable here.
- Fallback used: direct shell retrieval of public pages and PDFs.

## Recommended Pain Points

1. Inventory is scarce enough that weekly awareness matters.
   Spain-wide portal supply fell 11% year over year in Q4 2025, while Mallorca-specific sources still describe supply as tight and demand as deep.

2. Palma and the southwest need micro-market monitoring, not generic island averages.
   Premium demand clusters differently across Palma, Bendinat, Portals, Santa Ponsa, and Port d'Andratx.

3. International demand competes for the same stock.
   Balearic transactions remain meaningfully international, and Mallorca's prime-buyer mix is diversifying rather than fading.

4. Clients get distracted by policy headlines.
   Teams need filtered market signal because headline proposals can sound dramatic even when the legal framework has not changed.

## Validated Proof Points

### 1. Tight supply makes faster listing awareness useful

- Spanish Property Insight reported that homes for sale in Spain fell 11% year over year in Q4 2025, citing Idealista.
- Knight Frank says Mallorca supply is tight, demand is deep, and prime values rose around 3% in the last 12 months.
- Website-safe framing:
  "In a supply-constrained market, missing a new listing or price move costs time."

### 2. The southwest corridor is still the premium acquisition zone

- Knight Frank says the southwest from Port d'Andratx to Bendinat and Portals retains blue-chip status.
- The same report says sea-view villas there can exceed €15 million.
- Website-safe framing:
  "We start where buyer competition is hardest: Palma and Mallorca's southwest corridor."

### 3. Mallorca remains internationally competed

- Spanish Property Insight's summary of the Engel & Volkers H1 2025 update says overseas purchasers accounted for 28% of Balearic transactions.
- Knight Frank says foreign demand on Mallorca is nearly double 2010 levels and the buyer mix is broadening beyond Germans and Britons.
- Website-safe framing:
  "You're not only competing with local demand. You're competing in an international market."

### 4. The market is resilient, not distressed

- SPI says Balearic home sales in H1 2025 were just over 7,300, slightly above the ten-year average.
- Knight Frank forecasts roughly 2% to 4% prime growth in 2026.
- Website-safe framing:
  "This is a monitoring problem, not a bargain-hunting crash story."

### 5. The product already produces auditable supply, pricing, and comp outputs

- The local product slice generated municipality medians, cohort summaries, comparable sets, raw-record paths, and SHA-linked audit traces on 2026-03-27.
- Current internal output:
  Palma median asking price in the fixture slice was €1.1M, and Calvia's villa cohort median was €2.35M.
- Website-safe framing:
  "Current product outputs already show supply, pricing, and comparable-market views with source traceability."

## Market Examples For The Page

### Palma

- Knight Frank cites a €550 million airport expansion.
- The same report says Mallorca now has links to 166 destinations served by 52 airlines.
- It also highlights Palma waterfront regeneration and Club de Mar upgrades.
- Translation for website copy:
  Palma is not just a scenic anchor. It is the operational center of a year-round, internationally connected market.

### Southwest Corridor

- Knight Frank says the southwest remains blue-chip and that sea-view villas can exceed €15 million.
- The report contrasts that with east-coast villas around €6M to €6.5M, roughly half southwest pricing.
- Translation for website copy:
  The southwest is where pricing pressure and buyer competition justify a tighter intelligence workflow first.

### Product-Side Example

- The current local slice already outputs Palma and Calvia municipality summaries plus comparable sets with raw source paths.
- This is enough for UI proof or a screenshot block, but not enough to claim full live-market coverage.

## Claim Caveats

1. Do not say the product already covers live Mallorca inventory end to end.
   The current local proof uses a fixture ingestion, not a live source crawl.

2. Do not present Balearic-wide or Spain-wide figures as Palma-only facts.
   Keep those labels explicit.

3. Do not use crash or distress language.
   The source set supports resilient demand, selective scarcity, and steady price growth.

4. Do not imply foreign-buyer restrictions are active.
   SPI reported on 2026-03-04 that the Balearic non-resident buyer ban proposal failed and changed nothing legally.

## Source Quality

| Source | Quality | Why it matters |
| --- | --- | --- |
| Knight Frank, *Mallorca Residential Market Insight 2026* | High | Mallorca-specific, premium-market detail, primary report PDF |
| SPI summary of Engel & Volkers H1 2025 update | Medium | Good Balearic transaction and buyer-mix context, but secondary |
| SPI article citing Idealista supply data, 2026-03-23 | Medium | Strong for supply-tightness backdrop, but national rather than Palma-specific |
| SPI article on failed foreign-buyer ban proposal, 2026-03-04 | Medium | Good policy caveat source, not a core market-demand source |
| Internal `report-latest --json` output | Internal | Product proof only, not public live-market evidence |

## Source Links

- Knight Frank: https://www.knightfrank.co.uk/site-assets/research/report-pdfs/mallorca-residential-market-insight/mallorca-insight-2025_final-singles.pdf
- SPI / E&V H1 2025: https://www.spanishpropertyinsight.com/2025/10/07/evm-h1-balearic-market-update/
- SPI / Idealista supply backdrop: https://www.spanishpropertyinsight.com/2026/03/23/prices-rise-as-supply-of-homes-for-sale-shrinks-across-most-areas/
- SPI / policy caveat: https://www.spanishpropertyinsight.com/2026/03/04/balearic-proposal-to-ban-non-resident-buyers-just-theatrics/
