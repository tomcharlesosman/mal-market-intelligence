import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { MarketingSiteSnapshot } from "./marketing-site.js";
import {
  formatArea,
  formatBedrooms,
  formatCurrency,
  formatDate,
  formatPercent,
  humanizePropertyType,
  numberFormatter,
} from "./marketing-site-format.js";

type MarketingSiteDocumentProps = {
  snapshot: MarketingSiteSnapshot;
};

type ProcessRailProps = {
  children: ReactNode;
  description: string;
  label: string;
  title: string;
};

function MetricLedgerRow({
  metric,
}: {
  metric: MarketingSiteSnapshot["metrics"][number];
}) {
  return (
    <article className="metric-ledger-row">
      <p className="eyebrow">{metric.label}</p>
      <h3>{metric.value}</h3>
      <p>{metric.detail}</p>
    </article>
  );
}

function MunicipalityLedgerRow({
  municipality,
}: {
  municipality: MarketingSiteSnapshot["municipalitySnapshots"][number];
}) {
  return (
    <article className="municipality-ledger-row">
      <p className="eyebrow">{municipality.municipality}</p>
      <h3>{numberFormatter.format(municipality.listingCount)} listings</h3>
      <p>Median ask {formatCurrency(municipality.medianAskingPriceEur)}</p>
      <p>Median €/sqm {formatCurrency(municipality.medianAskingPricePerSqmEur)}</p>
    </article>
  );
}

function ListingRow({
  listing,
  index,
}: {
  listing: MarketingSiteSnapshot["spotlightListings"][number];
  index: number;
}) {
  const summary = [
    formatCurrency(listing.askingPriceEur),
    `${formatCurrency(listing.askingPricePerSqmEur)} €/sqm`,
    formatArea(listing.builtAreaSqm),
    formatBedrooms(listing.bedrooms),
  ].join(" · ");

  return (
    <article className="listing-row">
      <div className="listing-index">{String(index + 1).padStart(2, "0")}</div>
      <div className="listing-copy">
        <div className="listing-topline">
          <p className="eyebrow">
            {listing.municipality}
            {listing.neighborhood ? ` / ${listing.neighborhood}` : ""}
          </p>
          <span>{humanizePropertyType(listing.propertyType)}</span>
        </div>
        <h3>{listing.title}</h3>
        <p className="listing-summary">{summary}</p>
      </div>
      <div className="listing-proof">
        <p className="audit-path">
          <span>Audit path</span>
          <code>{listing.rawRecordPath}</code>
        </p>
        <div className="listing-actions">
          <a href={listing.listingUrl} target="_blank" rel="noreferrer">
            Source listing
          </a>
          <span>sha {listing.rawRecordSha256.slice(0, 12)}</span>
        </div>
      </div>
    </article>
  );
}

function ComparableRow({
  comparable,
  index,
}: {
  comparable: MarketingSiteSnapshot["comparableExample"]["comparables"][number];
  index: number;
}) {
  return (
    <article className="comparison-row">
      <div className="comparison-header">
        <p className="eyebrow">Comparable {index + 1}</p>
        <span>Score {numberFormatter.format(comparable.similarityScore)}</span>
      </div>
      <div className="comparison-body">
        <div>
          <h3>{comparable.title}</h3>
          <p>
            {comparable.municipality}
            {comparable.neighborhood ? ` / ${comparable.neighborhood}` : ""}
          </p>
          <ul className="comparison-meta">
            <li>{formatCurrency(comparable.askingPriceEur)}</li>
            <li>{formatCurrency(comparable.askingPricePerSqmEur)} €/sqm</li>
            <li>{formatArea(comparable.builtAreaSqm)}</li>
          </ul>
        </div>
        <dl>
          <div>
            <dt>Municipality match</dt>
            <dd>{comparable.sameMunicipality ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>Type match</dt>
            <dd>{comparable.samePropertyType ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>€/sqm delta</dt>
            <dd>{formatPercent(comparable.pricePerSqmDeltaPct)}</dd>
          </div>
          <div>
            <dt>Area delta</dt>
            <dd>{formatPercent(comparable.builtAreaDeltaPct)}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

function WorkflowRailStep({
  step,
}: {
  step: MarketingSiteSnapshot["workflow"][number];
}) {
  return (
    <article className="workflow-rail-step">
      <p className="step-index">{step.step}</p>
      <h3>{step.title}</h3>
      <p>{step.description}</p>
    </article>
  );
}

function ProcessRail({
  children,
  description,
  label,
  title,
}: ProcessRailProps) {
  return (
    <article className="process-row">
      <p className="process-label">{label}</p>
      <div className="process-copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <dl className="process-facts">{children}</dl>
    </article>
  );
}

function MarketingSiteDocument({
  snapshot,
}: MarketingSiteDocumentProps) {
  const leadMetric = snapshot.metrics[0];
  const municipalityLead = snapshot.municipalitySnapshots[0];
  const comparableSubject = snapshot.comparableExample.subject;

  if (!leadMetric || !municipalityLead) {
    throw new Error("Cannot render the website without lead metrics and municipality coverage.");
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>MAL | Mallorca acquisition radar</title>
        <meta
          name="description"
          content="Mallorca market intelligence for boutique buyer's agents and lean acquisition teams."
        />
        <meta
          name="generator"
          content="MAL React + TypeScript static renderer"
        />
        <link rel="stylesheet" href="./styles.css" />
      </head>
      <body>
        <header className="site-header">
          <div className="site-warning">
            <span>Field dossier</span>
            <span>Audited Mallorca sample</span>
            <span>{formatDate(snapshot.run.capturedAt)}</span>
          </div>
          <div className="site-header-main">
            <a className="brand" href="#top">
              <span className="brand-mark">MAL</span>
              <span className="brand-meta">Mallorca acquisition radar</span>
            </a>
            <nav>
              <a href="#brief">Brief</a>
              <a href="#method">Method</a>
              <a href="#product-proof">Proof</a>
              <a href="#access">Access</a>
            </nav>
          </div>
        </header>

        <main id="top">
          <section className="hero">
            <div className="hero-board">
              <div className="hero-board-rule">
                <span>Palma / southwest corridor</span>
                <span>{snapshot.run.source}</span>
                <span>{leadMetric.value}</span>
              </div>
              <div className="hero-grid">
                <div className="hero-copy">
                  <p className="eyebrow">{snapshot.hero.eyebrow}</p>
                  <p className="hero-brand">MAL</p>
                  <h1 className="hero-headline">{snapshot.hero.headline}</h1>
                  <p className="lede">{snapshot.hero.subhead}</p>
                  <div className="hero-actions">
                    <a className="button-primary" href={snapshot.cta.href}>
                      {snapshot.cta.label}
                    </a>
                    <a className="button-secondary" href="./market-proof.json">
                      Download proof JSON
                    </a>
                  </div>
                  <p className="hero-note">{snapshot.hero.proofNote}</p>
                </div>

                <div className="hero-dossier">
                  <div className="dossier-panel">
                    <p className="eyebrow">Current field run</p>
                    <div className="manifest-ledger">
                      <div className="manifest-row">
                        <span>Run</span>
                        <strong>{snapshot.run.runId}</strong>
                      </div>
                      <div className="manifest-row">
                        <span>Capture</span>
                        <strong>{formatDate(snapshot.run.capturedAt)}</strong>
                      </div>
                      <div className="manifest-row">
                        <span>Source</span>
                        <strong>{snapshot.run.source}</strong>
                      </div>
                      <div className="manifest-row">
                        <span>Coverage</span>
                        <strong>{leadMetric.value}</strong>
                      </div>
                      <div className="manifest-row">
                        <span>Audit path</span>
                        <code>{snapshot.run.auditPath}</code>
                      </div>
                    </div>
                  </div>

                  <div className="territory-panel">
                    <div className="territory-heading">
                      <p className="eyebrow">Territory watch</p>
                      <h2>Palma and the southwest corridor.</h2>
                    </div>
                    <p className="territory-copy">
                      Weekly visibility for boutique buyer&apos;s agents and lean
                      acquisition teams before the feed turns into noise.
                    </p>
                    <div className="territory-ledger">
                      {snapshot.spotlightListings.slice(0, 3).map((listing) => (
                        <div className="territory-row" key={listing.listingId}>
                          <div>
                            <p>{listing.neighborhood ?? listing.municipality}</p>
                            <span>{listing.municipality}</span>
                          </div>
                          <strong>{formatCurrency(listing.askingPricePerSqmEur)} €/sqm</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="hero-metric-rail">
                {snapshot.metrics.map((metric) => (
                  <MetricLedgerRow key={metric.label} metric={metric} />
                ))}
              </div>
            </div>
          </section>

          <section className="section memo-section" id="brief" data-section="01">
            <div className="section-heading">
              <p className="eyebrow">Proof-led thesis</p>
              <h2>One Mallorca brief with the evidence still attached.</h2>
              <p className="section-copy">
                The first release stays narrow on premium-resale monitoring.
                MAL leads with territory, then with proof, then with the
                deterministic workflow an operator can audit.
              </p>
            </div>

            <div className="memo-grid">
              <article className="memo-sheet">
                <p className="memo-stamp">A / Failure mode</p>
                <h3>Mallorca sourcing breaks the moment evidence gets detached from place.</h3>
                <ol className="memo-list">
                  {snapshot.problemStatements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </article>

              <article className="memo-sheet memo-sheet-accent">
                <p className="memo-stamp">B / MAL correction</p>
                <h3>One operating surface for Palma and the southwest corridor.</h3>
                <ol className="memo-list">
                  {snapshot.solutionStatements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </article>
            </div>
          </section>

          <section className="section mechanism-section" id="method" data-section="02">
            <div className="section-heading">
              <p className="eyebrow">Operating system</p>
              <h2>Three rails from raw capture to an operator-ready brief.</h2>
              <p className="section-copy">
                The product story stays simple: store the exact source snapshot,
                normalize it into one Mallorca contract, and publish the brief
                with proof still visible.
              </p>
            </div>

            <div className="process-ledger">
              <ProcessRail
                label="01 / Capture"
                title="Store the source snapshot before interpretation."
                description={snapshot.workflow[0]?.description ?? ""}
              >
                <div>
                  <dt>Source</dt>
                  <dd>{snapshot.run.source}</dd>
                </div>
                <div>
                  <dt>Captured</dt>
                  <dd>{formatDate(snapshot.run.capturedAt)}</dd>
                </div>
                <div>
                  <dt>Snapshot file</dt>
                  <dd>
                    <code>{snapshot.run.sourceSnapshotPath}</code>
                  </dd>
                </div>
                <div>
                  <dt>Search path</dt>
                  <dd>
                    {snapshot.run.searchUrl ? (
                      <a href={snapshot.run.searchUrl} target="_blank" rel="noreferrer">
                        Source listing search
                      </a>
                    ) : (
                      "Direct source URL not available."
                    )}
                  </dd>
                </div>
              </ProcessRail>

              <ProcessRail
                label="02 / Normalize"
                title="Reshape listings into one stable Mallorca contract."
                description={snapshot.workflow[1]?.description ?? ""}
              >
                <div>
                  <dt>Raw rows</dt>
                  <dd>{numberFormatter.format(snapshot.run.rawRecordCount)}</dd>
                </div>
                <div>
                  <dt>Normalized</dt>
                  <dd>{numberFormatter.format(snapshot.run.normalizedRecordCount)}</dd>
                </div>
                <div>
                  <dt>Rejected</dt>
                  <dd>{numberFormatter.format(snapshot.run.skippedRecordCount)}</dd>
                </div>
                <div>
                  <dt>Normalized file</dt>
                  <dd>
                    <code>{snapshot.run.normalizedPath}</code>
                  </dd>
                </div>
              </ProcessRail>

              <ProcessRail
                label="03 / Brief"
                title="Ship medians, comps, and proof as one visible surface."
                description={snapshot.workflow[2]?.description ?? ""}
              >
                <div>
                  <dt>Lead municipality</dt>
                  <dd>{municipalityLead.municipality}</dd>
                </div>
                <div>
                  <dt>Median ask</dt>
                  <dd>{snapshot.metrics[1]?.value ?? "n/a"}</dd>
                </div>
                <div>
                  <dt>Comparable subject</dt>
                  <dd>{comparableSubject.title}</dd>
                </div>
                <div>
                  <dt>Proof payload</dt>
                  <dd>
                    <a href="./market-proof.json">market-proof.json</a>
                  </dd>
                </div>
              </ProcessRail>
            </div>
          </section>

          <section className="section proof-section" id="product-proof" data-section="03">
            <div className="section-heading">
              <p className="eyebrow">Current audited coverage</p>
              <h2>Municipality signal, listing ledger, and pricing deltas in one run.</h2>
              <p className="section-copy">
                The proof surface stays narrow on purpose: municipality context,
                a small set of spotlight listings, and one comparable subject
                with explicit deltas instead of market-wide claims.
              </p>
            </div>

            <div className="municipality-ledger">
              {snapshot.municipalitySnapshots.map((municipality) => (
                <MunicipalityLedgerRow
                  key={municipality.municipality}
                  municipality={municipality}
                />
              ))}
            </div>

            <div className="proof-ledger">
              <div className="listing-ledger">
                <div className="proof-rail-head">
                  <p className="eyebrow">Spotlight ledger</p>
                  <span>{leadMetric.value}</span>
                </div>
                {snapshot.spotlightListings.map((listing, index) => (
                  <ListingRow
                    key={listing.listingId}
                    listing={listing}
                    index={index}
                  />
                ))}
              </div>

              <aside className="subject-dossier">
                <p className="eyebrow">Comparable subject</p>
                <h3>{comparableSubject.title}</h3>
                <p className="comparison-subject-summary">
                  {[
                    comparableSubject.municipality +
                      (comparableSubject.neighborhood
                        ? ` / ${comparableSubject.neighborhood}`
                        : ""),
                    humanizePropertyType(comparableSubject.propertyType),
                    formatCurrency(comparableSubject.askingPriceEur),
                  ].join(" · ")}
                </p>
                <p className="subject-note">
                  MAL ranks nearby alternatives with explicit municipality, type,
                  price-per-sqm, and area deltas so pricing conversations start
                  from evidence instead of instinct.
                </p>
                <p className="audit-path">
                  <span>Audit path</span>
                  <code>{comparableSubject.rawRecordPath}</code>
                </p>
                <div className="subject-actions">
                  <a href={comparableSubject.listingUrl} target="_blank" rel="noreferrer">
                    Source listing
                  </a>
                  <a href="./market-proof.json">Proof JSON</a>
                </div>
                <div className="subject-ledger">
                  {snapshot.metrics.map((metric) => (
                    <MetricLedgerRow key={metric.label} metric={metric} />
                  ))}
                </div>
              </aside>
            </div>

            <div className="comparison-ledger">
              <div className="proof-rail-head">
                <p className="eyebrow">Comparable evidence</p>
                <span>{comparableSubject.title}</span>
              </div>
              {snapshot.comparableExample.comparables.map((comparable, index) => (
                <ComparableRow
                  key={comparable.listingId}
                  comparable={comparable}
                  index={index}
                />
              ))}
            </div>
          </section>

          <section className="section workflow-section" id="workflow" data-section="04">
            <div className="section-heading">
              <p className="eyebrow">Weekly operator workflow</p>
              <h2>One deterministic rhythm from capture to buyer conversation.</h2>
              <p className="section-copy">
                The workflow remains compact: capture once, normalize once, then
                review the brief with provenance and comps still attached.
              </p>
            </div>
            <div className="workflow-rail">
              {snapshot.workflow.map((step) => (
                <WorkflowRailStep key={step.step} step={step} />
              ))}
            </div>
          </section>

          <section className="cta-section" id="access" data-section="05">
            <div className="access-board">
              <div className="access-copy">
                <p className="eyebrow">Access request</p>
                <h2>Request the current Mallorca brief.</h2>
                <p>
                  The current slice is intentionally narrow: Palma plus the
                  southwest corridor, proof-backed listing changes, and
                  comparable context that can survive scrutiny.
                </p>
                <div className="hero-actions">
                  <a className="button-primary" href={snapshot.cta.href}>
                    {snapshot.cta.label}
                  </a>
                  <a className="button-secondary" href="./market-proof.json">
                    Inspect the data payload
                  </a>
                </div>
                <p className="hero-note">{snapshot.cta.note}</p>
              </div>

              <div className="access-audit">
                <article className="audit-line">
                  <p className="eyebrow">Source snapshot</p>
                  <code>{snapshot.run.sourceSnapshotPath}</code>
                  <p>sha {snapshot.run.sourceSnapshotSha256}</p>
                </article>
                <article className="audit-line">
                  <p className="eyebrow">Manifest</p>
                  <code>{snapshot.run.manifestPath}</code>
                  <p>
                    Normalized file: <code>{snapshot.run.normalizedPath}</code>
                  </p>
                </article>
                <article className="audit-line">
                  <p className="eyebrow">Search path</p>
                  <p>
                    {snapshot.run.searchUrl ? (
                      <a
                        href={snapshot.run.searchUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {snapshot.run.searchUrl}
                      </a>
                    ) : (
                      "Direct source URL not available."
                    )}
                  </p>
                  <p>
                    Proof JSON: <code>market-proof.json</code>
                  </p>
                </article>
              </div>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}

export function renderMarketingSiteDocument(
  snapshot: MarketingSiteSnapshot,
): string {
  return `<!DOCTYPE html>\n${renderToStaticMarkup(
    <MarketingSiteDocument snapshot={snapshot} />,
  )}`;
}
