import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { z } from "zod";

import { config, type RuntimeConfig } from "../config.js";
import {
  ingestManifestSchema,
  normalizedListingSchema,
  rawListingRecordSchema,
  type IngestManifest,
  type NormalizedListing,
} from "../domain/listing.js";
import {
  appendAuditEvent,
  appendNdjson,
  ensureDir,
  relativeToDataRoot,
  writeJsonFile,
  writeTextFile,
} from "./run-store.js";

const idealistaCoordinatesSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

const idealistaListingSchema = z.object({
  propertyCode: z.string().min(1),
  url: z.string().url(),
  title: z.string().min(1).optional(),
  operation: z.string().min(1).optional(),
  propertyType: z.string().min(1).optional(),
  price: z
    .object({
      amount: z.coerce.number().nonnegative().optional(),
      currency: z.string().min(1).optional(),
    })
    .optional(),
  location: z
    .object({
      municipality: z.string().min(1).optional(),
      neighborhood: z.string().min(1).optional(),
      coordinates: idealistaCoordinatesSchema.optional(),
    })
    .optional(),
  features: z
    .object({
      bedrooms: z.coerce.number().int().nonnegative().optional(),
      bathrooms: z.coerce.number().nonnegative().optional(),
      builtAreaSqm: z.coerce.number().positive().optional(),
      lotAreaSqm: z.coerce.number().positive().optional(),
    })
    .optional(),
});

const idealistaSnapshotSchema = z.object({
  source: z.literal("idealista"),
  capturedAt: z.string().datetime({ offset: true }),
  searchUrl: z.string().url(),
  listings: z.array(idealistaListingSchema),
});

const idealistaRawListingRecordSchema = rawListingRecordSchema.extend({
  source: z.literal("idealista"),
  payload: idealistaListingSchema,
});

type IdealistaListing = z.infer<typeof idealistaListingSchema>;
type IdealistaRawListingRecord = z.infer<typeof idealistaRawListingRecordSchema>;

export type IdealistaNormalizationResult =
  | { kind: "normalized"; listing: NormalizedListing }
  | { kind: "skipped"; reason: string };

const propertyTypeMap: Record<string, NormalizedListing["propertyType"]> = {
  apartment: "apartment",
  atico: "penthouse",
  chalet: "villa",
  country_house: "finca",
  finca: "finca",
  finca_rustica: "finca",
  flat: "apartment",
  house: "house",
  land: "land",
  penthouse: "penthouse",
  piso: "apartment",
  plot: "land",
  townhouse: "townhouse",
  villa: "villa",
};

function toRunId(source: string, now: Date): string {
  return `${source}-${now.toISOString().replace(/[:.]/g, "-")}`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function maybeTrim(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function mapOperation(value: string | undefined): NormalizedListing["operation"] | null {
  const normalized = maybeTrim(value)?.toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized === "sale" || normalized === "venta") {
    return "sale";
  }

  if (normalized === "rent" || normalized === "alquiler") {
    return "rent";
  }

  return null;
}

function mapPropertyType(value: string | undefined): NormalizedListing["propertyType"] {
  const normalized = maybeTrim(value)
    ?.replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (!normalized) {
    return "unknown";
  }

  return propertyTypeMap[normalized] ?? "unknown";
}

export function buildIdealistaRawRecord(
  snapshotCapturedAt: string,
  listing: IdealistaListing,
): IdealistaRawListingRecord {
  return idealistaRawListingRecordSchema.parse({
    source: "idealista",
    externalId: listing.propertyCode,
    capturedAt: snapshotCapturedAt,
    listingUrl: listing.url,
    payload: listing,
  });
}

export function tryNormalizeIdealistaRawRecord(
  record: IdealistaRawListingRecord,
  rawRecordPath: string,
  rawRecordSha256: string,
): IdealistaNormalizationResult {
  const { payload } = record;
  const title = maybeTrim(payload.title);
  const municipality = maybeTrim(payload.location?.municipality);
  const operation = mapOperation(payload.operation);
  const priceAmount = payload.price?.amount;
  const currency = payload.price?.currency ?? "EUR";

  if (!title) {
    return { kind: "skipped", reason: "missing title" };
  }

  if (!municipality) {
    return { kind: "skipped", reason: "missing municipality" };
  }

  if (!operation) {
    return { kind: "skipped", reason: "missing or unsupported operation" };
  }

  if (priceAmount === undefined) {
    return { kind: "skipped", reason: "missing asking price" };
  }

  if (currency !== "EUR") {
    return { kind: "skipped", reason: `unsupported currency ${currency}` };
  }

  const neighborhood = maybeTrim(payload.location?.neighborhood);
  const coordinates = payload.location?.coordinates;
  const features = payload.features;

  return {
    kind: "normalized",
    listing: normalizedListingSchema.parse({
      listingId: `${record.source}:${record.externalId}`,
      source: record.source,
      externalId: record.externalId,
      capturedAt: record.capturedAt,
      listingUrl: record.listingUrl,
      title,
      municipality,
      ...(neighborhood ? { neighborhood } : {}),
      operation,
      propertyType: mapPropertyType(payload.propertyType),
      askingPriceEur: priceAmount,
      ...(features?.bedrooms !== undefined ? { bedrooms: features.bedrooms } : {}),
      ...(features?.bathrooms !== undefined ? { bathrooms: features.bathrooms } : {}),
      ...(features?.builtAreaSqm !== undefined
        ? { builtAreaSqm: features.builtAreaSqm }
        : {}),
      ...(features?.lotAreaSqm !== undefined ? { lotAreaSqm: features.lotAreaSqm } : {}),
      ...(coordinates?.latitude !== undefined ? { latitude: coordinates.latitude } : {}),
      ...(coordinates?.longitude !== undefined
        ? { longitude: coordinates.longitude }
        : {}),
      rawRecordPath,
      rawRecordSha256,
    }),
  };
}

export async function runIdealistaFixtureIngestion(
  runtimeConfig: RuntimeConfig = config,
): Promise<IngestManifest> {
  const startedAt = new Date().toISOString();
  const snapshotContents = await fs.readFile(runtimeConfig.idealistaFixtureFile, "utf8");
  const snapshot = idealistaSnapshotSchema.parse(JSON.parse(snapshotContents));
  const runId = toRunId(snapshot.source, new Date(startedAt));
  const runRoot = path.join(runtimeConfig.dataRoot, "runs", runId);
  const rawDir = path.join(runRoot, "raw");
  const normalizedFile = path.join(runRoot, "normalized", "listings.ndjson");
  const manifestFile = path.join(runRoot, "manifest.json");
  const sourceSnapshotFile = path.join(runRoot, "source-snapshot.json");
  const runAuditFile = path.join(runRoot, "audit.ndjson");
  const sourceSnapshotBody = `${JSON.stringify(snapshot, null, 2)}\n`;

  await ensureDir(rawDir);
  await ensureDir(path.dirname(normalizedFile));
  await writeTextFile(normalizedFile, "");
  await writeTextFile(sourceSnapshotFile, sourceSnapshotBody);

  const sourceSnapshotSha256 = sha256(sourceSnapshotBody);

  await appendAuditEvent(runtimeConfig, runAuditFile, {
    runId,
    event: "ingest.started",
    recordedAt: startedAt,
    details: {
      source: snapshot.source,
      sourceCapturedAt: snapshot.capturedAt,
      sourceSnapshotFile: relativeToDataRoot(runtimeConfig, sourceSnapshotFile),
      sourceSnapshotSha256,
      searchUrl: snapshot.searchUrl,
      rawRecordCount: snapshot.listings.length,
    },
  });

  let normalizedRecordCount = 0;
  let skippedRecordCount = 0;

  for (const listing of snapshot.listings) {
    const rawRecord = buildIdealistaRawRecord(snapshot.capturedAt, listing);
    const rawBody = `${JSON.stringify(rawRecord, null, 2)}\n`;
    const rawRecordSha256 = sha256(rawBody);
    const rawFilePath = path.join(
      rawDir,
      `${rawRecord.externalId}-${rawRecordSha256.slice(0, 8)}.json`,
    );
    const rawRecordPath = relativeToDataRoot(runtimeConfig, rawFilePath);

    await writeTextFile(rawFilePath, rawBody);

    const normalizationResult = tryNormalizeIdealistaRawRecord(
      rawRecord,
      rawRecordPath,
      rawRecordSha256,
    );

    if (normalizationResult.kind === "skipped") {
      skippedRecordCount += 1;

      await appendAuditEvent(runtimeConfig, runAuditFile, {
        runId,
        event: "ingest.record-skipped",
        recordedAt: new Date().toISOString(),
        details: {
          externalId: rawRecord.externalId,
          rawRecordPath,
          rawRecordSha256,
          reason: normalizationResult.reason,
        },
      });

      continue;
    }

    normalizedRecordCount += 1;

    await appendNdjson(normalizedFile, normalizationResult.listing);
    await appendAuditEvent(runtimeConfig, runAuditFile, {
      runId,
      event: "ingest.record-normalized",
      recordedAt: new Date().toISOString(),
      details: {
        listingId: normalizationResult.listing.listingId,
        rawRecordPath: normalizationResult.listing.rawRecordPath,
        rawRecordSha256: normalizationResult.listing.rawRecordSha256,
      },
    });
  }

  const finishedAt = new Date().toISOString();
  const manifest = ingestManifestSchema.parse({
    runId,
    source: snapshot.source,
    startedAt,
    finishedAt,
    sourceCapture: {
      capturedAt: snapshot.capturedAt,
      searchUrl: snapshot.searchUrl,
      file: relativeToDataRoot(runtimeConfig, sourceSnapshotFile),
      sha256: sourceSnapshotSha256,
    },
    stats: {
      rawRecordCount: snapshot.listings.length,
      normalizedRecordCount,
      skippedRecordCount,
    },
    artifacts: {
      auditFile: relativeToDataRoot(runtimeConfig, runAuditFile),
      rawDir: relativeToDataRoot(runtimeConfig, rawDir),
      normalizedFile: relativeToDataRoot(runtimeConfig, normalizedFile),
    },
  });

  await writeJsonFile(manifestFile, manifest);
  await appendAuditEvent(runtimeConfig, runAuditFile, {
    runId,
    event: "ingest.completed",
    recordedAt: finishedAt,
    details: {
      manifestPath: relativeToDataRoot(runtimeConfig, manifestFile),
      normalizedRecordCount,
      skippedRecordCount,
    },
  });

  return manifest;
}
