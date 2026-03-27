import { z } from "zod";

export const sourceSlugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9_-]+$/);

export const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

export const operationSchema = z.enum(["sale", "rent"]);

export const propertyTypeSchema = z.enum([
  "apartment",
  "house",
  "villa",
  "finca",
  "penthouse",
  "townhouse",
  "land",
  "unknown",
]);

export const rawListingRecordSchema = z.object({
  source: sourceSlugSchema,
  externalId: z.string().min(1),
  capturedAt: z.string().datetime({ offset: true }),
  listingUrl: z.string().url(),
  payload: z.record(z.unknown()),
});

export type RawListingRecord = z.infer<typeof rawListingRecordSchema>;

export const normalizedListingSchema = z.object({
  listingId: z.string().min(1),
  source: sourceSlugSchema,
  externalId: z.string().min(1),
  capturedAt: z.string().datetime({ offset: true }),
  listingUrl: z.string().url(),
  title: z.string().min(1),
  municipality: z.string().min(1),
  neighborhood: z.string().min(1).optional(),
  operation: operationSchema,
  propertyType: propertyTypeSchema,
  askingPriceEur: z.number().nonnegative(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().nonnegative().optional(),
  builtAreaSqm: z.number().positive().optional(),
  lotAreaSqm: z.number().positive().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  rawRecordPath: z.string().min(1),
  rawRecordSha256: sha256Schema,
});

export type NormalizedListing = z.infer<typeof normalizedListingSchema>;

export const ingestManifestSchema = z.object({
  runId: z.string().min(1),
  source: sourceSlugSchema,
  startedAt: z.string().datetime({ offset: true }),
  finishedAt: z.string().datetime({ offset: true }),
  sourceCapture: z.object({
    capturedAt: z.string().datetime({ offset: true }),
    searchUrl: z.string().url().optional(),
    file: z.string().min(1),
    sha256: sha256Schema,
  }),
  stats: z.object({
    rawRecordCount: z.number().int().nonnegative(),
    normalizedRecordCount: z.number().int().nonnegative(),
    skippedRecordCount: z.number().int().nonnegative(),
  }),
  artifacts: z.object({
    auditFile: z.string().min(1),
    rawDir: z.string().min(1),
    normalizedFile: z.string().min(1),
  }),
});

export type IngestManifest = z.infer<typeof ingestManifestSchema>;

export const auditEventSchema = z.object({
  runId: z.string().min(1),
  event: z.enum([
    "ingest.started",
    "ingest.record-normalized",
    "ingest.record-skipped",
    "ingest.completed",
  ]),
  recordedAt: z.string().datetime({ offset: true }),
  details: z.record(z.unknown()),
});

export type AuditEvent = z.infer<typeof auditEventSchema>;
