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

type SystemModuleProps = {
  children: ReactNode;
  description: string;
  eyebrow: string;
  index: number;
  title: string;
};

function MetricBandItem({
  metric,
  index,
}: {
  metric: MarketingSiteSnapshot["metrics"][number];
  index: number;
}) {
  return (
    <article className={`metric-band-item reveal reveal-${(index % 4) + 1}`}>
      <p className="eyebrow">{metric.label}</p>
      <h3>{metric.value}</h3>
      <p>{metric.detail}</p>
    </article>
  );
}

function MunicipalityRow({
  municipality,
  index,
}: {
  municipality: MarketingSiteSnapshot["municipalitySnapshots"][number];
  index: number;
}) {
  return (
    <article className={`municipality-band reveal reveal-${(index % 4) + 1}`}>
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
    <article className={`listing-row reveal reveal-${(index % 4) + 1}`}>
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
    <article className={`comparison-row reveal reveal-${(index % 4) + 1}`}>
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

function WorkflowStep({
  step,
  index,
}: {
  step: MarketingSiteSnapshot["workflow"][number];
  index: number;
}) {
  return (
    <article className={`workflow-step reveal reveal-${(index % 4) + 1}`}>
      <p className="step-index">{step.step}</p>
      <h3>{step.title}</h3>
      <p>{step.description}</p>
    </article>
  );
}

function SystemModule({
  children,
  description,
  eyebrow,
  index,
  title,
}: SystemModuleProps) {
  return (
    <article className={`system-module reveal reveal-${(index % 4) + 1}`}>
      <div className="system-module-label">
        <p className="eyebrow">{eyebrow}</p>
      </div>
      <div className="system-module-copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="system-module-proof">{children}</div>
    </article>
  );
}

function MarketingSiteDocument({
  snapshot,
}: MarketingSiteDocumentProps) {
  const [leadMetric, medianAskMetric, medianSqmMetric, rejectedMetric] =
    snapshot.metrics;
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
        <header className="site-header reveal reveal-1">
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
        </header>

        <main id="top">
          <section className="hero">
            <div className="hero-shell">
              <div className="hero-copy">
                <p className="eyebrow reveal reveal-1">{snapshot.hero.eyebrow}</p>
                <p className="hero-brand reveal reveal-1">MAL</p>
                <h1 className="hero-headline reveal reveal-2">{snapshot.hero.headline}</h1>
                <p className="lede reveal reveal-3">{snapshot.hero.subhead}</p>
                <div className="hero-actions reveal reveal-4">
                  <a className="button-primary" href={snapshot.cta.href}>
                    {snapshot.cta.label}
                  </a>
                  <a className="button-secondary" href="./market-proof.json">
                    Download proof JSON
                  </a>
                </div>
                <p className="hero-note reveal reveal-4">{snapshot.hero.proofNote}</p>
                <div className="hero-facts reveal reveal-4">
                  <div>
                    <span>{leadMetric.label}</span>
                    <strong>{leadMetric.value}</strong>
                  </div>
                  <div>
                    <span>{medianAskMetric?.label ?? "Median asking price"}</span>
                    <strong>{medianAskMetric?.value ?? "n/a"}</strong>
                  </div>
                  <div>
                    <span>Comparable subject</span>
                    <strong>{comparableSubject.municipality}</strong>
                  </div>
                </div>
              </div>

              <div className="hero-stage reveal reveal-2">
                <div className="hero-stage-grid" aria-hidden="true"></div>
                <div className="hero-stage-map" aria-hidden="true"></div>
                <p className="hero-stage-region">Mallorca / Palma / Southwest corridor</p>
                <div className="hero-stage-manifest">
                  <p className="eyebrow">Current field run</p>
                  <div className="hero-manifest-line">
                    <span>Run</span>
                    <strong>{snapshot.run.runId}</strong>
                  </div>
                  <div className="hero-manifest-line">
                    <span>Capture</span>
                    <strong>{formatDate(snapshot.run.capturedAt)}</strong>
                  </div>
                  <div className="hero-manifest-line">
                    <span>Source</span>
                    <strong>{snapshot.run.source}</strong>
                  </div>
                  <div className="hero-manifest-line">
                    <span>Coverage</span>
                    <strong>{leadMetric.value}</strong>
                  </div>
                  <div className="hero-manifest-line">
                    <span>Audit path</span>
                    <code>{snapshot.run.auditPath}</code>
                  </div>
                </div>
                <div className="hero-stage-points">
                  {snapshot.spotlightListings.slice(0, 3).map((listing, index) => (
                    <article
                      key={listing.listingId}
                      className={`hero-point hero-point-${index + 1}`}
                    >
                      <p>{listing.neighborhood ?? listing.municipality}</p>
                      <span>{formatCurrency(listing.askingPricePerSqmEur)} €/sqm</span>
                    </article>
                  ))}
                </div>
                <div className="hero-stage-footer">
                  <p className="eyebrow">Territory focus</p>
                  <h2>Palma / southwest corridor.</h2>
                  <p>
                    Weekly visibility for boutique buyer&apos;s agents and lean
                    acquisition teams before the feed turns into noise.
                  </p>
                  <div className="hero-stage-footer-grid">
                    <div>
                      <span>Median €/sqm</span>
                      <strong>{medianSqmMetric?.value ?? "n/a"}</strong>
                    </div>
                    <div>
                      <span>Rejected rows</span>
                      <strong>{rejectedMetric?.value ?? "n/a"}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section support-section" id="brief" data-section="01">
            <div className="section-heading reveal reveal-1">
              <p className="eyebrow">Proof-led thesis</p>
              <h2>One Mallorca brief with the evidence still attached.</h2>
              <p className="section-copy">
                The first release stays narrow on premium-resale monitoring.
                MAL leads with territory, then with proof, then with the
                deterministic workflow an operator can audit.
              </p>
            </div>
            <div className="support-summary reveal reveal-2">
              <p className="support-lead">
                Use place-specific coverage, comparable context, and raw-record
                provenance to keep Palma apartments and southwest villas readable
                as one market without flattening the differences that matter.
              </p>
              <div className="support-metrics">
                <div>
                  <span>{leadMetric.label}</span>
                  <strong>{leadMetric.value}</strong>
                </div>
                <div>
                  <span>{medianAskMetric?.label ?? "Median asking price"}</span>
                  <strong>{medianAskMetric?.value ?? "n/a"}</strong>
                </div>
                <div>
                  <span>{medianSqmMetric?.label ?? "Median asking price per sqm"}</span>
                  <strong>{medianSqmMetric?.value ?? "n/a"}</strong>
                </div>
              </div>
            </div>
            <div className="contrast-grid">
              <article className="contrast-panel reveal reveal-1">
                <p className="eyebrow">Why teams lose the edge</p>
                <h3>
                  Mallorca sourcing breaks the moment evidence gets detached from
                  place.
                </h3>
                <ul className="bullet-list">
                  {snapshot.problemStatements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
              <article className="contrast-panel contrast-panel-accent reveal reveal-2">
                <p className="eyebrow">What MAL changes</p>
                <h3>One operating surface for Palma and the southwest corridor.</h3>
                <ul className="bullet-list">
                  {snapshot.solutionStatements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>
          </section>

          <section className="section system-section" id="method" data-section="02">
            <div className="section-heading reveal reveal-1">
              <p className="eyebrow">Operating system</p>
              <h2>Three rails from raw capture to an operator-ready brief.</h2>
              <p className="section-copy">
                The product story stays simple: store the exact source snapshot,
                normalize it into one Mallorca contract, and publish the brief
                with proof still visible.
              </p>
            </div>
            <div className="system-grid">
              <SystemModule
                eyebrow="Capture"
                title="Store the source snapshot before interpretation."
                description={snapshot.workflow[0]?.description ?? ""}
                index={0}
              >
                <dl className="system-facts">
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
                  {snapshot.run.searchUrl ? (
                    <div>
                      <dt>Search path</dt>
                      <dd>
                        <a href={snapshot.run.searchUrl} target="_blank" rel="noreferrer">
                          Source listing search
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </SystemModule>
              <SystemModule
                eyebrow="Normalize"
                title="Reshape listings into one stable Mallorca contract."
                description={snapshot.workflow[1]?.description ?? ""}
                index={1}
              >
                <dl className="system-facts">
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
                </dl>
              </SystemModule>
              <SystemModule
                eyebrow="Brief"
                title="Ship medians, comps, and proof as one visible surface."
                description={snapshot.workflow[2]?.description ?? ""}
                index={2}
              >
                <dl className="system-facts">
                  <div>
                    <dt>Lead municipality</dt>
                    <dd>{municipalityLead.municipality}</dd>
                  </div>
                  <div>
                    <dt>Median ask</dt>
                    <dd>{medianAskMetric?.value ?? "n/a"}</dd>
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
                </dl>
              </SystemModule>
            </div>
          </section>

          <section className="section proof-section" id="product-proof" data-section="03">
            <div className="section-heading reveal reveal-1">
              <p className="eyebrow">Current audited coverage</p>
              <h2>Municipality signal, listing ledger, and pricing deltas in one run.</h2>
              <p className="section-copy">
                The proof surface stays narrow on purpose: municipality context,
                a small set of spotlight listings, and one comparable subject
                with explicit deltas instead of market-wide claims.
              </p>
            </div>
            <div className="municipality-grid">
              {snapshot.municipalitySnapshots.map((municipality, index) => (
                <MunicipalityRow
                  key={municipality.municipality}
                  municipality={municipality}
                  index={index}
                />
              ))}
            </div>
            <div className="proof-body">
              <div className="listing-grid">
                {snapshot.spotlightListings.map((listing, index) => (
                  <ListingRow
                    key={listing.listingId}
                    listing={listing}
                    index={index}
                  />
                ))}
              </div>
              <aside className="subject-rail reveal reveal-2">
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
                <div className="subject-metrics">
                  {snapshot.metrics.map((metric, index) => (
                    <MetricBandItem
                      key={metric.label}
                      metric={metric}
                      index={index}
                    />
                  ))}
                </div>
              </aside>
            </div>
            <div className="comparison-grid">
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
            <div className="section-heading reveal reveal-1">
              <p className="eyebrow">Weekly operator workflow</p>
              <h2>One deterministic rhythm from capture to buyer conversation.</h2>
              <p className="section-copy">
                The workflow remains compact: capture once, normalize once, then
                review the brief with provenance and comps still attached.
              </p>
            </div>
            <div className="workflow-grid">
              {snapshot.workflow.map((step, index) => (
                <WorkflowStep key={step.step} step={step} index={index} />
              ))}
            </div>
          </section>

          <section className="cta-section" id="access" data-section="05">
            <div className="cta-panel">
              <div className="cta-copy reveal reveal-1">
                <p className="eyebrow">Next step</p>
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
              <div className="cta-audit reveal reveal-2">
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
