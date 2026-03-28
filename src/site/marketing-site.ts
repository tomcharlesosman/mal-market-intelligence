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
import { renderMarketingSiteDocument } from "./marketing-site-app.js";
import { marketingSiteCss } from "./marketing-site-css.js";
import {
  formatCurrency,
  formatDate,
  numberFormatter,
} from "./marketing-site-format.js";

const DEFAULT_OUTPUT_DIR = path.resolve(process.cwd(), "dist", "site");
const DEFAULT_CTA_URL =
  "mailto:tomcharlesosman@gmail.com?subject=MAL%20Mallorca%20private%20access";
const DEFAULT_CTA_LABEL = "Request the Mallorca brief";

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
      "Portal tabs flatten high-value stock into a feed. Teams lose the shape of Palma and the southwest corridor the moment sourcing becomes routine.",
      "Comparable work arrives too late. By the time a buyer asks for pricing context, the best inventory has already been explained with guesswork.",
      "Spreadsheet summaries erase provenance. When somebody challenges a number, the source path is rarely still attached.",
    ],
    solutionStatements: [
      "One Mallorca-specific workflow turns source capture, normalization, and proof into a weekly acquisition brief instead of another watchlist.",
      "Municipality medians expose pricing by place and property type, so Palma apartments and southwest villas stop living inside one blended average.",
      "Comparable views keep every listing tied to its raw record path and snapshot hash, so pricing conversations stay inspectable.",
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

function renderCss(): string {
  return marketingSiteCss;
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
  const html = renderMarketingSiteDocument(snapshot);
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
