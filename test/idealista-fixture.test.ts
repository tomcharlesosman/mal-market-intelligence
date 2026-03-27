import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { resolveConfig } from "../src/config.js";
import { ingestManifestSchema } from "../src/domain/listing.js";
import {
  buildIdealistaRawRecord,
  runIdealistaFixtureIngestion,
  tryNormalizeIdealistaRawRecord,
} from "../src/ingestion/idealista-fixture.js";
import {
  readLatestManifest,
  readNormalizedListings,
  writeJsonFile,
} from "../src/ingestion/run-store.js";

const tempDirs: string[] = [];

async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mal-ingest-"));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((tempDir) =>
      fs.rm(tempDir, { recursive: true, force: true }),
    ),
  );
});

describe("tryNormalizeIdealistaRawRecord", () => {
  it("maps an Idealista-shaped raw record into the normalized listing contract", () => {
    const rawRecord = buildIdealistaRawRecord("2026-03-26T08:00:00.000Z", {
      propertyCode: "PALMA-001",
      url: "https://www.idealista.com/en/inmueble/PALMA-001/",
      title: "Sea-view apartment in Portixol",
      operation: "sale",
      propertyType: "flat",
      price: {
        amount: 950000,
        currency: "EUR",
      },
      location: {
        municipality: "Palma",
        neighborhood: "Portixol",
        coordinates: {
          latitude: 39.5638,
          longitude: 2.6699,
        },
      },
      features: {
        bedrooms: 3,
        bathrooms: 2,
        builtAreaSqm: 118,
      },
    });

    const result = tryNormalizeIdealistaRawRecord(
      rawRecord,
      "runs/idealista-1/raw/PALMA-001.json",
      "abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    );

    expect(result.kind).toBe("normalized");

    if (result.kind !== "normalized") {
      throw new Error("Expected a normalized result.");
    }

    expect(result.listing.listingId).toBe("idealista:PALMA-001");
    expect(result.listing.propertyType).toBe("apartment");
    expect(result.listing.askingPriceEur).toBe(950000);
    expect(result.listing.rawRecordPath).toBe("runs/idealista-1/raw/PALMA-001.json");
  });

  it("skips records that are missing required intelligence fields", () => {
    const rawRecord = buildIdealistaRawRecord("2026-03-26T08:00:00.000Z", {
      propertyCode: "SENCELLES-004",
      url: "https://www.idealista.com/en/inmueble/SENCELLES-004/",
      title: "Country house with unfinished pricing",
      operation: "sale",
      propertyType: "finca_rustica",
      location: {
        municipality: "Sencelles",
      },
      features: {
        bedrooms: 6,
        builtAreaSqm: 280,
      },
    });

    expect(
      tryNormalizeIdealistaRawRecord(
        rawRecord,
        "runs/idealista-1/raw/SENCELLES-004.json",
        "abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      ),
    ).toEqual({
      kind: "skipped",
      reason: "missing asking price",
    });
  });
});

describe("runIdealistaFixtureIngestion", () => {
  it("writes auditable run artifacts, counts skipped records, and exposes the latest manifest", async () => {
    const dataRoot = await createTempDir();
    const runtimeConfig = resolveConfig({
      dataRoot,
      idealistaFixtureFile: path.resolve(
        process.cwd(),
        "fixtures",
        "idealista-mallorca-snapshot.json",
      ),
    });

    const manifest = await runIdealistaFixtureIngestion(runtimeConfig);
    const listings = await readNormalizedListings(manifest, runtimeConfig);
    const latestManifest = await readLatestManifest(runtimeConfig);
    const auditContents = await fs.readFile(
      path.join(runtimeConfig.dataRoot, manifest.artifacts.auditFile),
      "utf8",
    );

    expect(manifest.stats).toEqual({
      rawRecordCount: 4,
      normalizedRecordCount: 3,
      skippedRecordCount: 1,
    });
    expect(latestManifest.runId).toBe(manifest.runId);
    expect(listings).toHaveLength(3);
    expect(
      auditContents
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line).event),
    ).toEqual([
      "ingest.started",
      "ingest.record-normalized",
      "ingest.record-normalized",
      "ingest.record-normalized",
      "ingest.record-skipped",
      "ingest.completed",
    ]);
  });
});

describe("readLatestManifest", () => {
  it("prefers the newest valid manifest by timestamp and ignores legacy manifests", async () => {
    const dataRoot = await createTempDir();
    const runtimeConfig = resolveConfig({
      dataRoot,
      idealistaFixtureFile: path.resolve(
        process.cwd(),
        "fixtures",
        "idealista-mallorca-snapshot.json",
      ),
    });

    const runsDir = path.join(dataRoot, "runs");
    const olderManifestDir = path.join(runsDir, "z-run");
    const newerManifestDir = path.join(runsDir, "a-run");
    const legacyManifestDir = path.join(runsDir, "legacy-run");

    await writeJsonFile(path.join(legacyManifestDir, "manifest.json"), {
      runId: "legacy-run",
      source: "idealista",
    });
    await writeJsonFile(
      path.join(olderManifestDir, "manifest.json"),
      ingestManifestSchema.parse({
        runId: "z-run",
        source: "idealista",
        startedAt: "2026-03-26T09:00:00.000Z",
        finishedAt: "2026-03-26T09:05:00.000Z",
        sourceCapture: {
          capturedAt: "2026-03-26T08:00:00.000Z",
          file: "runs/z-run/source-snapshot.json",
          sha256:
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
          searchUrl:
            "https://www.idealista.com/en/venta-viviendas/balears-illes/mallorca/",
        },
        stats: {
          rawRecordCount: 2,
          normalizedRecordCount: 2,
          skippedRecordCount: 0,
        },
        artifacts: {
          auditFile: "runs/z-run/audit.ndjson",
          rawDir: "runs/z-run/raw",
          normalizedFile: "runs/z-run/normalized/listings.ndjson",
        },
      }),
    );
    await writeJsonFile(
      path.join(newerManifestDir, "manifest.json"),
      ingestManifestSchema.parse({
        runId: "a-run",
        source: "idealista",
        startedAt: "2026-03-26T10:00:00.000Z",
        finishedAt: "2026-03-26T10:05:00.000Z",
        sourceCapture: {
          capturedAt: "2026-03-26T08:30:00.000Z",
          file: "runs/a-run/source-snapshot.json",
          sha256:
            "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
          searchUrl:
            "https://www.idealista.com/en/venta-viviendas/balears-illes/mallorca/",
        },
        stats: {
          rawRecordCount: 3,
          normalizedRecordCount: 2,
          skippedRecordCount: 1,
        },
        artifacts: {
          auditFile: "runs/a-run/audit.ndjson",
          rawDir: "runs/a-run/raw",
          normalizedFile: "runs/a-run/normalized/listings.ndjson",
        },
      }),
    );

    const latestManifest = await readLatestManifest(runtimeConfig);

    expect(latestManifest.runId).toBe("a-run");
  });
});
