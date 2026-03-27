import { promises as fs } from "node:fs";
import path from "node:path";

import { z } from "zod";

import { config, type RuntimeConfig } from "../config.js";
import {
  auditEventSchema,
  ingestManifestSchema,
  normalizedListingSchema,
  type AuditEvent,
  type IngestManifest,
  type NormalizedListing,
} from "../domain/listing.js";

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function writeTextFile(
  filePath: string,
  contents: string,
): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, contents, "utf8");
}

export async function writeJsonFile(
  filePath: string,
  record: unknown,
): Promise<void> {
  await writeTextFile(filePath, `${JSON.stringify(record, null, 2)}\n`);
}

export async function appendNdjson(
  filePath: string,
  record: unknown,
): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.appendFile(filePath, `${JSON.stringify(record)}\n`, "utf8");
}

export function relativeToDataRoot(
  runtimeConfig: RuntimeConfig,
  filePath: string,
): string {
  return path.relative(runtimeConfig.dataRoot, filePath);
}

export async function appendAuditEvent(
  runtimeConfig: RuntimeConfig,
  runAuditFile: string,
  event: AuditEvent,
): Promise<void> {
  const parsedEvent = auditEventSchema.parse(event);
  const globalAuditFile = path.join(runtimeConfig.dataRoot, "audit", "ingestion.ndjson");

  await appendNdjson(globalAuditFile, parsedEvent);
  await appendNdjson(runAuditFile, parsedEvent);
}

export async function readLatestManifest(
  runtimeConfig: RuntimeConfig = config,
): Promise<IngestManifest> {
  const runsDir = path.join(runtimeConfig.dataRoot, "runs");

  let entries;

  try {
    entries = await fs.readdir(runsDir, { withFileTypes: true });
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException | undefined)?.code;

    if (code === "ENOENT") {
      throw new Error("No valid ingestion runs found. Run `npm run ingest:idealista` first.");
    }

    throw error;
  }

  const manifests: IngestManifest[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const manifestFile = path.join(runsDir, entry.name, "manifest.json");

    try {
      const manifestContents = await fs.readFile(manifestFile, "utf8");
      manifests.push(ingestManifestSchema.parse(JSON.parse(manifestContents)));
    } catch (error: unknown) {
      const code = (error as NodeJS.ErrnoException | undefined)?.code;

      if (
        code === "ENOENT" ||
        error instanceof SyntaxError ||
        error instanceof z.ZodError
      ) {
        continue;
      }

      throw error;
    }
  }

  const latestManifest = manifests
    .sort(
      (left, right) =>
        Date.parse(left.finishedAt) - Date.parse(right.finishedAt),
    )
    .at(-1);

  if (!latestManifest) {
    throw new Error("No valid ingestion runs found. Run `npm run ingest:idealista` first.");
  }

  return latestManifest;
}

export async function readNormalizedListings(
  manifest: IngestManifest,
  runtimeConfig: RuntimeConfig = config,
): Promise<NormalizedListing[]> {
  const normalizedFile = path.join(runtimeConfig.dataRoot, manifest.artifacts.normalizedFile);
  const contents = await fs.readFile(normalizedFile, "utf8");

  return contents
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => normalizedListingSchema.parse(JSON.parse(line)));
}
