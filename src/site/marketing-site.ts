import path from "node:path";

import { z } from "zod";

import { config, type RuntimeConfig } from "../config.js";
import { sha256Schema, type IngestManifest } from "../domain/listing.js";
import { runIdealistaFixtureIngestion } from "../ingestion/idealista-fixture.js";
import {
  readLatestManifest,
  readNormalizedListings,
  writeJsonFile,
  writeTextFile,
} from "../ingestion/run-store.js";
import {
  buildMarketIntelligenceReport,
  type ComparableListing,
  type ComparableSet,
  type MarketIntelligenceReport,
} from "../intelligence/market-summary.js";

const DEFAULT_OUTPUT_DIR = path.resolve(process.cwd(), "dist", "site");
const DEFAULT_CTA_URL =
  "mailto:hello@example.com?subject=Mallorca%20acquisition%20radar";
const DEFAULT_CTA_LABEL = "Request private access";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-GB");

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const marketingSiteMetricSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  detail: z.string().min(1),
});

const marketingSiteMunicipalitySchema = z.object({
  municipality: z.string().min(1),
  listingCount: z.number().int().nonnegative(),
  medianAskingPriceEur: z.number().nonnegative(),
  medianAskingPricePerSqmEur: z.number().nonnegative().nullable(),
});

const marketingSiteListingSchema = z.object({
  listingId: z.string().min(1),
  title: z.string().min(1),
  municipality: z.string().min(1),
  neighborhood: z.string().min(1).nullable(),
  operation: z.enum(["sale", "rent"]),
  propertyType: z.string().min(1),
  askingPriceEur: z.number().nonnegative(),
  askingPricePerSqmEur: z.number().nonnegative().nullable(),
  builtAreaSqm: z.number().positive().nullable(),
  bedrooms: z.number().int().nonnegative().nullable(),
  listingUrl: z.string().url(),
  rawRecordPath: z.string().min(1),
  rawRecordSha256: sha256Schema,
});

const marketingSiteComparableSchema = marketingSiteListingSchema.extend({
  similarityScore: z.number().nonnegative(),
  pricePerSqmDeltaPct: z.number().nonnegative().nullable(),
  builtAreaDeltaPct: z.number().nonnegative().nullable(),
  sameMunicipality: z.boolean(),
  sameNeighborhood: z.boolean(),
  samePropertyType: z.boolean(),
});

const marketingSiteWorkflowStepSchema = z.object({
  step: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
});

export const marketingSiteSnapshotSchema = z.object({
  generatedAt: z.string().datetime({ offset: true }),
  hero: z.object({
    eyebrow: z.string().min(1),
    headline: z.string().min(1),
    subhead: z.string().min(1),
    proofNote: z.string().min(1),
  }),
  problemStatements: z.array(z.string().min(1)).min(3),
  solutionStatements: z.array(z.string().min(1)).min(3),
  run: z.object({
    runId: z.string().min(1),
    source: z.string().min(1),
    capturedAt: z.string().datetime({ offset: true }),
    searchUrl: z.string().url().optional(),
    sourceSnapshotPath: z.string().min(1),
    sourceSnapshotSha256: sha256Schema,
    manifestPath: z.string().min(1),
    normalizedPath: z.string().min(1),
    auditPath: z.string().min(1),
    rawRecordCount: z.number().int().nonnegative(),
    normalizedRecordCount: z.number().int().nonnegative(),
    skippedRecordCount: z.number().int().nonnegative(),
  }),
  metrics: z.array(marketingSiteMetricSchema).min(3),
  municipalitySnapshots: z.array(marketingSiteMunicipalitySchema).min(1),
  spotlightListings: z.array(marketingSiteListingSchema).min(1),
  comparableExample: z.object({
    subject: marketingSiteListingSchema,
    comparables: z.array(marketingSiteComparableSchema).min(1),
  }),
  workflow: z.array(marketingSiteWorkflowStepSchema).min(3),
  cta: z.object({
    label: z.string().min(1),
    href: z.string().min(1),
    note: z.string().min(1),
  }),
});

export type MarketingSiteSnapshot = z.infer<typeof marketingSiteSnapshotSchema>;

export type BuildMarketingSiteOptions = {
  runtimeConfig?: RuntimeConfig;
  outputDir?: string;
  ctaUrl?: string;
  ctaLabel?: string;
};

export type BuildMarketingSiteResult = {
  outputDir: string;
  htmlFile: string;
  cssFile: string;
  dataFile: string;
  snapshot: MarketingSiteSnapshot;
};

function formatCurrency(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return currencyFormatter.format(value);
}

function formatArea(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return `${numberFormatter.format(value)} sqm`;
}

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function formatBedrooms(value: number | null): string {
  if (value === null) {
    return "Beds n/a";
  }

  return `${numberFormatter.format(value)} bed`;
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return `${numberFormatter.format(value)}%`;
}

function humanizePropertyType(value: string): string {
  return value
    .split("_")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function toSpotlightListing(
  report: MarketIntelligenceReport,
): MarketingSiteSnapshot["spotlightListings"] {
  return report.comparableSets
    .map((set) => set.subject)
    .sort((left, right) => right.askingPriceEur - left.askingPriceEur)
    .map((listing) => ({
      listingId: listing.listingId,
      title: listing.title,
      municipality: listing.municipality,
      neighborhood: listing.neighborhood ?? null,
      operation: listing.operation,
      propertyType: listing.propertyType,
      askingPriceEur: listing.askingPriceEur,
      askingPricePerSqmEur: listing.askingPricePerSqmEur,
      builtAreaSqm: listing.builtAreaSqm,
      bedrooms: listing.bedrooms,
      listingUrl: listing.listingUrl,
      rawRecordPath: listing.rawRecordPath,
      rawRecordSha256: listing.rawRecordSha256,
    }));
}

function toComparableView(
  comparableSet: ComparableSet,
): MarketingSiteSnapshot["comparableExample"] {
  return {
    subject: {
      listingId: comparableSet.subject.listingId,
      title: comparableSet.subject.title,
      municipality: comparableSet.subject.municipality,
      neighborhood: comparableSet.subject.neighborhood ?? null,
      operation: comparableSet.subject.operation,
      propertyType: comparableSet.subject.propertyType,
      askingPriceEur: comparableSet.subject.askingPriceEur,
      askingPricePerSqmEur: comparableSet.subject.askingPricePerSqmEur,
      builtAreaSqm: comparableSet.subject.builtAreaSqm,
      bedrooms: comparableSet.subject.bedrooms,
      listingUrl: comparableSet.subject.listingUrl,
      rawRecordPath: comparableSet.subject.rawRecordPath,
      rawRecordSha256: comparableSet.subject.rawRecordSha256,
    },
    comparables: comparableSet.comparables.map((comparable) =>
      toComparableSnapshot(comparable),
    ),
  };
}

function toComparableSnapshot(
  comparable: ComparableListing,
): MarketingSiteSnapshot["comparableExample"]["comparables"][number] {
  return {
    listingId: comparable.listingId,
    title: comparable.title,
    municipality: comparable.municipality,
    neighborhood: comparable.neighborhood ?? null,
    operation: comparable.operation,
    propertyType: comparable.propertyType,
    askingPriceEur: comparable.askingPriceEur,
    askingPricePerSqmEur: comparable.askingPricePerSqmEur,
    builtAreaSqm: comparable.builtAreaSqm,
    bedrooms: comparable.bedrooms,
    listingUrl: comparable.listingUrl,
    rawRecordPath: comparable.rawRecordPath,
    rawRecordSha256: comparable.rawRecordSha256,
    similarityScore: comparable.similarityScore,
    pricePerSqmDeltaPct: comparable.matchSignals.pricePerSqmDeltaPct,
    builtAreaDeltaPct: comparable.matchSignals.builtAreaDeltaPct,
    sameMunicipality: comparable.matchSignals.sameMunicipality,
    sameNeighborhood: comparable.matchSignals.sameNeighborhood,
    samePropertyType: comparable.matchSignals.samePropertyType,
  };
}

function pickComparableExample(
  report: MarketIntelligenceReport,
): ComparableSet {
  const matchingMunicipalitySet = report.comparableSets.find((set) =>
    set.comparables.some((comparable) => comparable.matchSignals.sameMunicipality),
  );

  const comparableSet = matchingMunicipalitySet ?? report.comparableSets[0];

  if (!comparableSet) {
    throw new Error("Cannot build the website without at least one comparable view.");
  }

  return comparableSet;
}

function buildMarketingSiteSnapshot(
  manifest: IngestManifest,
  report: MarketIntelligenceReport,
  options: Required<Pick<BuildMarketingSiteOptions, "ctaLabel" | "ctaUrl">>,
): MarketingSiteSnapshot {
  const comparableSet = pickComparableExample(report);
  const highlightListings = toSpotlightListing(report);
  const sourceCaptureDate = formatDate(manifest.sourceCapture.capturedAt);
  const usesDefaultCta = options.ctaUrl === DEFAULT_CTA_URL;
  const proofNote =
    "Current proof comes from the latest audited Mallorca sample run. The page is explicit about source coverage instead of pretending the crawl is already exhaustive.";

  return marketingSiteSnapshotSchema.parse({
    generatedAt: new Date().toISOString(),
    hero: {
      eyebrow: "Mallorca acquisition radar",
      headline:
        "Track Palma and the southwest corridor before the portals turn into noise.",
      subhead:
        "MAL gives boutique buyer's agents and lean acquisition teams one evidence-backed view of premium-resale supply, pricing, and comparable context across Mallorca.",
      proofNote,
    },
    problemStatements: [
      "Portal tabs hide the market shape. Teams still jump across fragmented listing sources just to see what appeared this week.",
      "Pricing context arrives late. By the time agents rebuild comps manually, the best inventory has already moved.",
      "Audit trails disappear in spreadsheets. When a buyer asks where a number came from, the proof path is usually gone.",
    ],
    solutionStatements: [
      "One Mallorca-specific workflow for source capture, normalization, and operator-ready market evidence.",
      "Cohort medians expose supply and pricing by municipality, operation, and property type instead of one blended average.",
      "Comparable views keep each listing tied to its raw record path and snapshot hash so the evidence chain stays inspectable.",
    ],
    run: {
      runId: manifest.runId,
      source: manifest.source,
      capturedAt: manifest.sourceCapture.capturedAt,
      ...(manifest.sourceCapture.searchUrl
        ? { searchUrl: manifest.sourceCapture.searchUrl }
        : {}),
      sourceSnapshotPath: manifest.sourceCapture.file,
      sourceSnapshotSha256: manifest.sourceCapture.sha256,
      manifestPath: path.join("runs", manifest.runId, "manifest.json"),
      normalizedPath: manifest.artifacts.normalizedFile,
      auditPath: manifest.artifacts.auditFile,
      rawRecordCount: manifest.stats.rawRecordCount,
      normalizedRecordCount: manifest.stats.normalizedRecordCount,
      skippedRecordCount: manifest.stats.skippedRecordCount,
    },
    metrics: [
      {
        label: "Current audited coverage",
        value: `${numberFormatter.format(manifest.stats.normalizedRecordCount)} listings`,
        detail: `Latest Mallorca sample captured ${sourceCaptureDate} from ${manifest.source}.`,
      },
      {
        label: "Median asking price",
        value: formatCurrency(report.summary.medianAskingPriceEur),
        detail: "Across the current audited sale sample.",
      },
      {
        label: "Median asking price per sqm",
        value: formatCurrency(report.summary.medianAskingPricePerSqmEur),
        detail: "Useful when Palma apartments and southwest villas sit in the same conversation.",
      },
      {
        label: "Rejected records",
        value: `${numberFormatter.format(manifest.stats.skippedRecordCount)} skipped`,
        detail: "Incomplete source rows are retained in the audit trail instead of silently dropped.",
      },
    ],
    municipalitySnapshots: report.summary.byMunicipality.map((municipality) => ({
      municipality: municipality.municipality,
      listingCount: municipality.listingCount,
      medianAskingPriceEur: municipality.medianAskingPriceEur,
      medianAskingPricePerSqmEur: municipality.medianAskingPricePerSqmEur,
    })),
    spotlightListings: highlightListings,
    comparableExample: toComparableView(comparableSet),
    workflow: [
      {
        step: "01",
        title: "Capture the source snapshot",
        description:
          "Each run stores the exact source snapshot, manifest, and audit log before any downstream interpretation happens.",
      },
      {
        step: "02",
        title: "Normalize into Mallorca market records",
        description:
          "Listings are reshaped into a stable contract with municipality, property type, pricing, surface area, and raw-record provenance.",
      },
      {
        step: "03",
        title: "Review supply, medians, and comps",
        description:
          "Operators get a compact weekly brief with cohort pricing and comparable views instead of another spreadsheet tab farm.",
      },
    ],
    cta: {
      label: options.ctaLabel,
      href: options.ctaUrl,
      note: usesDefaultCta
        ? "Before publishing, replace the default example inbox by setting MAL_SITE_CTA_URL."
        : "Request a private walkthrough of the current Palma and southwest-corridor intelligence slice.",
    },
  });
}

function renderMetricCards(
  metrics: MarketingSiteSnapshot["metrics"],
): string {
  return metrics
    .map(
      (metric, index) => `
        <article class="metric-card reveal reveal-${(index % 4) + 1}">
          <p class="eyebrow">${escapeHtml(metric.label)}</p>
          <h3>${escapeHtml(metric.value)}</h3>
          <p>${escapeHtml(metric.detail)}</p>
        </article>
      `,
    )
    .join("");
}

function renderMunicipalityCards(
  municipalities: MarketingSiteSnapshot["municipalitySnapshots"],
): string {
  return municipalities
    .map(
      (municipality, index) => `
        <article class="corridor-card reveal reveal-${(index % 4) + 1}">
          <p class="corridor-label">${escapeHtml(municipality.municipality)}</p>
          <h3>${numberFormatter.format(municipality.listingCount)} tracked listings</h3>
          <p>Median ask ${escapeHtml(formatCurrency(municipality.medianAskingPriceEur))}</p>
          <p>Median €/sqm ${escapeHtml(
            formatCurrency(municipality.medianAskingPricePerSqmEur),
          )}</p>
        </article>
      `,
    )
    .join("");
}

function renderListingCards(
  listings: MarketingSiteSnapshot["spotlightListings"],
): string {
  return listings
    .map(
      (listing, index) => `
        <article class="listing-card reveal reveal-${(index % 4) + 1}">
          <div class="listing-topline">
            <p class="eyebrow">${escapeHtml(listing.municipality)}${listing.neighborhood ? ` / ${escapeHtml(listing.neighborhood)}` : ""}</p>
            <span>${escapeHtml(humanizePropertyType(listing.propertyType))}</span>
          </div>
          <h3>${escapeHtml(listing.title)}</h3>
          <div class="listing-price-row">
            <strong>${escapeHtml(formatCurrency(listing.askingPriceEur))}</strong>
            <span>${escapeHtml(formatCurrency(listing.askingPricePerSqmEur))} €/sqm</span>
          </div>
          <ul class="listing-meta">
            <li>${escapeHtml(formatArea(listing.builtAreaSqm))}</li>
            <li>${escapeHtml(formatBedrooms(listing.bedrooms))}</li>
            <li>${escapeHtml(listing.operation)}</li>
          </ul>
          <p class="audit-path"><span>Audit path</span><code>${escapeHtml(listing.rawRecordPath)}</code></p>
          <div class="listing-actions">
            <a href="${escapeHtml(listing.listingUrl)}" target="_blank" rel="noreferrer">Source listing</a>
            <span>sha ${escapeHtml(listing.rawRecordSha256.slice(0, 12))}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderComparableCards(
  comparables: MarketingSiteSnapshot["comparableExample"]["comparables"],
): string {
  return comparables
    .map(
      (comparable, index) => `
        <article class="comparison-card reveal reveal-${(index % 4) + 1}">
          <div class="comparison-header">
            <p class="eyebrow">Comparable ${index + 1}</p>
            <span>Score ${escapeHtml(numberFormatter.format(comparable.similarityScore))}</span>
          </div>
          <h3>${escapeHtml(comparable.title)}</h3>
          <p>${escapeHtml(comparable.municipality)}${comparable.neighborhood ? ` / ${escapeHtml(comparable.neighborhood)}` : ""}</p>
          <ul class="comparison-meta">
            <li>${escapeHtml(formatCurrency(comparable.askingPriceEur))}</li>
            <li>${escapeHtml(formatCurrency(comparable.askingPricePerSqmEur))} €/sqm</li>
            <li>${escapeHtml(formatArea(comparable.builtAreaSqm))}</li>
          </ul>
          <dl>
            <div>
              <dt>Municipality match</dt>
              <dd>${comparable.sameMunicipality ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt>Type match</dt>
              <dd>${comparable.samePropertyType ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt>€/sqm delta</dt>
              <dd>${escapeHtml(formatPercent(comparable.pricePerSqmDeltaPct))}</dd>
            </div>
            <div>
              <dt>Area delta</dt>
              <dd>${escapeHtml(formatPercent(comparable.builtAreaDeltaPct))}</dd>
            </div>
          </dl>
        </article>
      `,
    )
    .join("");
}

function renderWorkflowCards(
  workflow: MarketingSiteSnapshot["workflow"],
): string {
  return workflow
    .map(
      (step, index) => `
        <article class="workflow-card reveal reveal-${(index % 4) + 1}">
          <p class="step-index">${escapeHtml(step.step)}</p>
          <h3>${escapeHtml(step.title)}</h3>
          <p>${escapeHtml(step.description)}</p>
        </article>
      `,
    )
    .join("");
}

function renderBulletList(items: string[]): string {
  return items
    .map(
      (item) => `
        <li>${escapeHtml(item)}</li>
      `,
    )
    .join("");
}

function renderHtml(snapshot: MarketingSiteSnapshot): string {
  const comparableSubject = snapshot.comparableExample.subject;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MAL | Mallorca acquisition radar</title>
    <meta
      name="description"
      content="Mallorca market intelligence for boutique buyer's agents and lean acquisition teams."
    />
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div class="page-shell">
      <header class="site-header reveal reveal-1">
        <a class="brand" href="#top">MAL</a>
        <nav>
          <a href="#problem">Problem</a>
          <a href="#proof">Proof</a>
          <a href="#workflow">Workflow</a>
          <a href="#access">Access</a>
        </nav>
      </header>

      <main id="top">
        <section class="hero section">
          <div class="hero-copy reveal reveal-1">
            <p class="eyebrow">${escapeHtml(snapshot.hero.eyebrow)}</p>
            <h1>${escapeHtml(snapshot.hero.headline)}</h1>
            <p class="lede">${escapeHtml(snapshot.hero.subhead)}</p>
            <div class="hero-actions">
              <a class="button-primary" href="${escapeHtml(snapshot.cta.href)}">${escapeHtml(
                snapshot.cta.label,
              )}</a>
              <a class="button-secondary" href="./market-proof.json">Download proof JSON</a>
            </div>
            <p class="hero-note">${escapeHtml(snapshot.hero.proofNote)}</p>
          </div>

          <aside class="hero-proof reveal reveal-2">
            <p class="hero-proof-label">Current run snapshot</p>
            <h2>${escapeHtml(snapshot.run.runId)}</h2>
            <p>Captured ${escapeHtml(formatDate(snapshot.run.capturedAt))} from ${escapeHtml(
              snapshot.run.source,
            )}.</p>
            <dl>
              <div>
                <dt>Normalized</dt>
                <dd>${numberFormatter.format(snapshot.run.normalizedRecordCount)}</dd>
              </div>
              <div>
                <dt>Skipped</dt>
                <dd>${numberFormatter.format(snapshot.run.skippedRecordCount)}</dd>
              </div>
              <div>
                <dt>Audit</dt>
                <dd><code>${escapeHtml(snapshot.run.auditPath)}</code></dd>
              </div>
            </dl>
          </aside>
        </section>

        <section class="metrics-grid">
          ${renderMetricCards(snapshot.metrics)}
        </section>

        <section class="section split-section" id="problem">
          <div class="section-heading reveal reveal-1">
            <p class="eyebrow">Why this matters</p>
            <h2>Mallorca sourcing breaks down when the evidence is scattered.</h2>
          </div>
          <div class="bullet-panel reveal reveal-2">
            <ul>
              ${renderBulletList(snapshot.problemStatements)}
            </ul>
          </div>
        </section>

        <section class="section split-section">
          <div class="section-heading reveal reveal-1">
            <p class="eyebrow">What MAL does</p>
            <h2>An operator-first page, not another portal skin.</h2>
          </div>
          <div class="bullet-panel reveal reveal-2">
            <ul>
              ${renderBulletList(snapshot.solutionStatements)}
            </ul>
          </div>
        </section>

        <section class="section" id="proof">
          <div class="section-heading reveal reveal-1">
            <p class="eyebrow">Coverage snapshot</p>
            <h2>Current municipality signal from the latest audited run.</h2>
          </div>
          <div class="corridor-strip">
            ${renderMunicipalityCards(snapshot.municipalitySnapshots)}
          </div>
        </section>

        <section class="section">
          <div class="section-heading reveal reveal-1">
            <p class="eyebrow">Listing proof</p>
            <h2>Each card stays tied to a source listing and raw-record path.</h2>
          </div>
          <div class="listing-grid">
            ${renderListingCards(snapshot.spotlightListings)}
          </div>
        </section>

        <section class="section comparison-section">
          <div class="comparison-subject reveal reveal-1">
            <p class="eyebrow">Comparable view</p>
            <h2>${escapeHtml(comparableSubject.title)}</h2>
            <p>
              ${escapeHtml(comparableSubject.municipality)}${comparableSubject.neighborhood ? ` / ${escapeHtml(comparableSubject.neighborhood)}` : ""} ·
              ${escapeHtml(humanizePropertyType(comparableSubject.propertyType))} ·
              ${escapeHtml(formatCurrency(comparableSubject.askingPriceEur))}
            </p>
            <p class="subject-note">
              MAL already ranks nearby alternatives with explicit municipality, type, price-per-sqm, and area deltas.
            </p>
            <p class="audit-path"><span>Audit path</span><code>${escapeHtml(
              comparableSubject.rawRecordPath,
            )}</code></p>
          </div>
          <div class="comparison-grid">
            ${renderComparableCards(snapshot.comparableExample.comparables)}
          </div>
        </section>

        <section class="section" id="workflow">
          <div class="section-heading reveal reveal-1">
            <p class="eyebrow">Weekly operator workflow</p>
            <h2>Three steps from source capture to buyer-ready market context.</h2>
          </div>
          <div class="workflow-grid">
            ${renderWorkflowCards(snapshot.workflow)}
          </div>
        </section>

        <section class="section audit-section">
          <div class="section-heading reveal reveal-1">
            <p class="eyebrow">Audit trail</p>
            <h2>Public story, explicit provenance.</h2>
          </div>
          <div class="audit-grid">
            <article class="audit-card reveal reveal-1">
              <p class="eyebrow">Source snapshot</p>
              <code>${escapeHtml(snapshot.run.sourceSnapshotPath)}</code>
              <p>sha ${escapeHtml(snapshot.run.sourceSnapshotSha256)}</p>
            </article>
            <article class="audit-card reveal reveal-2">
              <p class="eyebrow">Manifest</p>
              <code>${escapeHtml(snapshot.run.manifestPath)}</code>
              <p>Normalized file: <code>${escapeHtml(snapshot.run.normalizedPath)}</code></p>
            </article>
            <article class="audit-card reveal reveal-3">
              <p class="eyebrow">Search path</p>
              <p>${snapshot.run.searchUrl ? `<a href="${escapeHtml(snapshot.run.searchUrl)}" target="_blank" rel="noreferrer">${escapeHtml(snapshot.run.searchUrl)}</a>` : "Direct source URL not available."}</p>
              <p>Proof JSON: <code>dist/site/market-proof.json</code></p>
            </article>
          </div>
        </section>

        <section class="section cta-section" id="access">
          <div class="cta-panel reveal reveal-1">
            <p class="eyebrow">Next step</p>
            <h2>Request a Mallorca radar walkthrough.</h2>
            <p>
              The first cut stays narrow on premium-resale sourcing for Palma and the southwest corridor. If that is your wedge, MAL is ready for operator feedback.
            </p>
            <div class="hero-actions">
              <a class="button-primary" href="${escapeHtml(snapshot.cta.href)}">${escapeHtml(
                snapshot.cta.label,
              )}</a>
              <a class="button-secondary" href="./market-proof.json">Inspect the data payload</a>
            </div>
            <p class="hero-note">${escapeHtml(snapshot.cta.note)}</p>
          </div>
        </section>
      </main>
    </div>
  </body>
</html>
`;
}

function renderCss(): string {
  return `:root {
  --ink: #181512;
  --sand: #f7efe3;
  --stone: #d8cab7;
  --clay: #b85c38;
  --olive: #54644e;
  --sea: #0e5162;
  --mist: rgba(247, 239, 227, 0.72);
  --panel: rgba(255, 252, 247, 0.82);
  --border: rgba(24, 21, 18, 0.12);
  --shadow: 0 24px 80px rgba(24, 21, 18, 0.12);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  color: var(--ink);
  background:
    radial-gradient(circle at top left, rgba(184, 92, 56, 0.18), transparent 32%),
    radial-gradient(circle at top right, rgba(14, 81, 98, 0.18), transparent 26%),
    linear-gradient(180deg, #fcf6ef 0%, #f2e7d8 100%);
  font-family: "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif;
}

a {
  color: inherit;
}

code {
  font-family: "SFMono-Regular", "Menlo", monospace;
  font-size: 0.88rem;
  word-break: break-word;
}

.page-shell {
  width: min(1180px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 24px 0 80px;
}

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0 28px;
}

.brand {
  letter-spacing: 0.16em;
  text-transform: uppercase;
  text-decoration: none;
  font-weight: 700;
}

.site-header nav {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.site-header nav a {
  text-decoration: none;
  color: rgba(24, 21, 18, 0.74);
}

.section {
  padding: 36px 0;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.9fr);
  gap: 24px;
  align-items: start;
}

.hero-copy,
.hero-proof,
.metric-card,
.bullet-panel,
.corridor-card,
.listing-card,
.comparison-card,
.workflow-card,
.audit-card,
.cta-panel {
  background: var(--panel);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.hero-copy,
.cta-panel {
  padding: 40px;
  border-radius: 32px;
}

.hero-proof {
  padding: 28px;
  border-radius: 28px;
}

.eyebrow,
.corridor-label,
.hero-proof-label,
.step-index {
  margin: 0 0 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.78rem;
  color: rgba(24, 21, 18, 0.66);
}

h1,
h2,
h3 {
  margin: 0;
  font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif;
  font-weight: 600;
  line-height: 1.02;
}

h1 {
  font-size: clamp(3rem, 5vw, 5.6rem);
  max-width: 10ch;
}

h2 {
  font-size: clamp(2rem, 3vw, 3.2rem);
  max-width: 14ch;
}

h3 {
  font-size: clamp(1.35rem, 2vw, 1.9rem);
}

.lede,
.hero-note,
.bullet-panel li,
.listing-card p,
.comparison-card p,
.workflow-card p,
.audit-card p,
.cta-panel p,
.hero-proof p,
.metric-card p,
.comparison-card dd,
.comparison-card dt {
  line-height: 1.6;
}

.lede {
  font-size: 1.12rem;
  max-width: 58ch;
  margin: 20px 0 0;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin: 28px 0 0;
}

.button-primary,
.button-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 22px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 600;
}

.button-primary {
  background: linear-gradient(135deg, var(--clay), #d48a5b);
  color: white;
}

.button-secondary {
  border: 1px solid rgba(24, 21, 18, 0.16);
  background: rgba(255, 255, 255, 0.56);
}

.hero-note {
  margin: 18px 0 0;
  color: rgba(24, 21, 18, 0.72);
}

.hero-proof dl,
.comparison-card dl {
  margin: 22px 0 0;
}

.hero-proof dl div,
.comparison-card dl div {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid rgba(24, 21, 18, 0.08);
}

.hero-proof dt,
.comparison-card dt {
  color: rgba(24, 21, 18, 0.66);
}

.hero-proof dd,
.comparison-card dd {
  margin: 0;
  text-align: right;
}

.metrics-grid,
.listing-grid,
.workflow-grid,
.audit-grid {
  display: grid;
  gap: 18px;
}

.metrics-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 18px;
}

.metric-card,
.workflow-card,
.audit-card {
  border-radius: 24px;
  padding: 24px;
}

.metric-card h3 {
  margin-top: 8px;
  font-size: 2rem;
}

.split-section {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 22px;
  align-items: start;
}

.section-heading {
  display: grid;
  gap: 12px;
}

.bullet-panel {
  padding: 28px;
  border-radius: 28px;
}

.bullet-panel ul,
.listing-meta,
.comparison-meta {
  margin: 0;
  padding-left: 18px;
}

.bullet-panel li + li {
  margin-top: 14px;
}

.corridor-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
  margin-top: 24px;
}

.corridor-card {
  border-radius: 28px;
  padding: 28px;
  position: relative;
  overflow: hidden;
}

.corridor-card::after {
  content: "";
  position: absolute;
  inset: auto -20% -55% auto;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(84, 100, 78, 0.22), transparent 72%);
}

.listing-grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  margin-top: 24px;
}

.listing-card,
.comparison-card {
  border-radius: 28px;
  padding: 26px;
}

.listing-topline,
.comparison-header,
.listing-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: space-between;
  align-items: center;
}

.listing-price-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: baseline;
  margin: 18px 0 10px;
}

.listing-price-row strong {
  font-size: 2rem;
}

.listing-meta li + li,
.comparison-meta li + li {
  margin-top: 6px;
}

.audit-path {
  margin: 18px 0 0;
}

.audit-path span {
  display: block;
  margin-bottom: 6px;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(24, 21, 18, 0.58);
}

.listing-actions {
  margin-top: 20px;
  font-size: 0.94rem;
}

.comparison-section {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 22px;
}

.comparison-subject {
  padding-right: 20px;
}

.subject-note {
  margin-top: 18px;
}

.comparison-grid {
  display: grid;
  gap: 18px;
}

.comparison-meta {
  margin: 16px 0 0;
}

.workflow-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 24px;
}

.step-index {
  color: var(--sea);
  font-size: 0.86rem;
}

.audit-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 24px;
}

.audit-card a {
  color: var(--sea);
}

.cta-section {
  padding-bottom: 0;
}

.cta-panel {
  position: relative;
  overflow: hidden;
}

.cta-panel::before {
  content: "";
  position: absolute;
  inset: -40% auto auto -10%;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(14, 81, 98, 0.14), transparent 68%);
}

.cta-panel > * {
  position: relative;
}

.reveal {
  opacity: 0;
  transform: translateY(18px);
}

@media (prefers-reduced-motion: no-preference) {
  .reveal {
    animation: rise 680ms ease forwards;
  }

  .reveal-1 {
    animation-delay: 60ms;
  }

  .reveal-2 {
    animation-delay: 120ms;
  }

  .reveal-3 {
    animation-delay: 180ms;
  }

  .reveal-4 {
    animation-delay: 240ms;
  }
}

@keyframes rise {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 980px) {
  .hero,
  .split-section,
  .comparison-section,
  .workflow-grid,
  .audit-grid,
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .comparison-subject {
    padding-right: 0;
  }
}

@media (max-width: 720px) {
  .page-shell {
    width: min(100vw - 24px, 1180px);
    padding-top: 16px;
    padding-bottom: 48px;
  }

  .site-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-copy,
  .cta-panel {
    padding: 28px;
  }

  .hero-proof,
  .metric-card,
  .bullet-panel,
  .corridor-card,
  .listing-card,
  .comparison-card,
  .workflow-card,
  .audit-card {
    padding: 22px;
  }

  h1 {
    font-size: clamp(2.5rem, 16vw, 4rem);
  }
}`;
}

async function loadLatestManifestOrSeed(
  runtimeConfig: RuntimeConfig,
): Promise<IngestManifest> {
  try {
    return await readLatestManifest(runtimeConfig);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("No valid ingestion runs found")
    ) {
      return runIdealistaFixtureIngestion(runtimeConfig);
    }

    throw error;
  }
}

export async function buildMarketingSite(
  options: BuildMarketingSiteOptions = {},
): Promise<BuildMarketingSiteResult> {
  const runtimeConfig = options.runtimeConfig ?? config;
  const outputDir = path.resolve(
    process.cwd(),
    options.outputDir ?? process.env.MAL_SITE_OUTPUT_DIR ?? DEFAULT_OUTPUT_DIR,
  );
  const ctaUrl = options.ctaUrl ?? process.env.MAL_SITE_CTA_URL ?? DEFAULT_CTA_URL;
  const ctaLabel =
    options.ctaLabel ?? process.env.MAL_SITE_CTA_LABEL ?? DEFAULT_CTA_LABEL;
  const manifest = await loadLatestManifestOrSeed(runtimeConfig);
  const listings = await readNormalizedListings(manifest, runtimeConfig);

  if (listings.length === 0) {
    throw new Error("Cannot build the website without normalized listings.");
  }

  const report = buildMarketIntelligenceReport(listings);
  const snapshot = buildMarketingSiteSnapshot(manifest, report, {
    ctaLabel,
    ctaUrl,
  });
  const html = renderHtml(snapshot);
  const css = renderCss();
  const htmlFile = path.join(outputDir, "index.html");
  const cssFile = path.join(outputDir, "styles.css");
  const dataFile = path.join(outputDir, "market-proof.json");

  await Promise.all([
    writeTextFile(htmlFile, html),
    writeTextFile(cssFile, css),
    writeJsonFile(dataFile, snapshot),
  ]);

  return {
    outputDir,
    htmlFile,
    cssFile,
    dataFile,
    snapshot,
  };
}
