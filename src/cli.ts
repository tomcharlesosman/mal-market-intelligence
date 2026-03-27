import {
  buildMarketIntelligenceReport,
} from "./intelligence/market-summary.js";
import {
  runIdealistaFixtureIngestion,
} from "./ingestion/idealista-fixture.js";
import {
  readLatestManifest,
  readNormalizedListings,
} from "./ingestion/run-store.js";
import { buildMarketingSite } from "./site/marketing-site.js";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-GB");

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

function formatPct(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return `${numberFormatter.format(value)}%`;
}

function printHelp(): void {
  console.log(`MAL CLI

Commands:
  ingest-idealista-fixture   Materialize an auditable Mallorca fixture ingestion run
  report-latest              Read the latest run and print a market intelligence report
  build-website              Generate the first public-facing Mallorca landing page

Aliases:
  ingest-sample
  report-sample
  build-site

Flags:
  --json                     Emit the report as structured JSON
`);
}

async function main(): Promise<void> {
  const command = process.argv[2];
  const outputJson = process.argv.includes("--json");

  if (!command) {
    printHelp();
    return;
  }

  if (command === "ingest-idealista-fixture" || command === "ingest-sample") {
    const manifest = await runIdealistaFixtureIngestion();
    console.log(`Created ingestion run ${manifest.runId}`);
    console.log(`Source: ${manifest.source}`);
    console.log(`Raw records: ${numberFormatter.format(manifest.stats.rawRecordCount)}`);
    console.log(
      `Normalized records: ${numberFormatter.format(manifest.stats.normalizedRecordCount)}`,
    );
    console.log(`Skipped records: ${numberFormatter.format(manifest.stats.skippedRecordCount)}`);
    console.log(`Audit file: ${manifest.artifacts.auditFile}`);
    console.log(`Normalized file: ${manifest.artifacts.normalizedFile}`);
    return;
  }

  if (command === "report-latest" || command === "report-sample") {
    const manifest = await readLatestManifest();
    const listings = await readNormalizedListings(manifest);
    const report = buildMarketIntelligenceReport(listings);

    if (outputJson) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    console.log(`Latest run: ${manifest.runId}`);
    console.log(`Source capture: ${manifest.sourceCapture.capturedAt}`);
    console.log(`Listings: ${numberFormatter.format(report.summary.listingCount)}`);
    console.log(
      `Median asking price: ${formatCurrency(report.summary.medianAskingPriceEur)}`,
    );
    console.log(
      `Median asking price per sqm: ${formatCurrency(
        report.summary.medianAskingPricePerSqmEur,
      )}`,
    );
    console.log(`Skipped during ingest: ${numberFormatter.format(manifest.stats.skippedRecordCount)}`);
    console.log("");
    console.log("Supply and pricing cohorts:");

    for (const cohort of report.cohorts) {
      console.log(
        `- ${cohort.municipality} | ${cohort.operation} | ${cohort.propertyType}: ${numberFormatter.format(
          cohort.listingCount,
        )} listings, median ${formatCurrency(
          cohort.medianAskingPriceEur,
        )}, median €/sqm ${formatCurrency(cohort.medianAskingPricePerSqmEur)}`,
      );
    }

    console.log("");
    console.log("Comparable views:");

    for (const comparableSet of report.comparableSets) {
      const subject = comparableSet.subject;
      console.log(
        `- ${subject.listingId}: ${subject.title} | ${subject.municipality} | ${subject.propertyType} | ${formatCurrency(
          subject.askingPriceEur,
        )} | ${formatArea(subject.builtAreaSqm)}`,
      );
      console.log(`  audit: ${subject.rawRecordPath}`);

      for (const comparable of comparableSet.comparables) {
        console.log(
          `  comparable ${comparable.listingId} | score ${numberFormatter.format(
            comparable.similarityScore,
          )} | ${comparable.municipality} | ${comparable.propertyType} | ${formatCurrency(
            comparable.askingPriceEur,
          )} | €/sqm delta ${formatPct(
            comparable.matchSignals.pricePerSqmDeltaPct,
          )} | area delta ${formatPct(comparable.matchSignals.builtAreaDeltaPct)}`,
        );
      }
    }

    return;
  }

  if (command === "build-website" || command === "build-site") {
    const result = await buildMarketingSite();
    console.log(`Generated website in ${result.outputDir}`);
    console.log(`Run: ${result.snapshot.run.runId}`);
    console.log(`HTML: ${result.htmlFile}`);
    console.log(`CSS: ${result.cssFile}`);
    console.log(`Proof JSON: ${result.dataFile}`);
    return;
  }

  printHelp();
  process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
