import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { resolveConfig } from "../src/config.js";
import { readLatestManifest } from "../src/ingestion/run-store.js";
import {
  buildMarketingSite,
  marketingSiteSnapshotSchema,
} from "../src/site/marketing-site.js";

const tempDirs: string[] = [];

async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mal-site-"));
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

describe("buildMarketingSite", () => {
  it("builds a React-rendered static website and proof snapshot from the latest auditable run", async () => {
    const dataRoot = await createTempDir();
    const outputDir = await createTempDir();
    const runtimeConfig = resolveConfig({
      dataRoot,
      idealistaFixtureFile: path.resolve(
        process.cwd(),
        "fixtures",
        "idealista-mallorca-snapshot.json",
      ),
    });

    const result = await buildMarketingSite({
      runtimeConfig,
      outputDir,
      ctaUrl: "mailto:deals@example.com?subject=Mallorca%20radar",
      ctaLabel: "Book the walkthrough",
    });

    const html = await fs.readFile(result.htmlFile, "utf8");
    const css = await fs.readFile(result.cssFile, "utf8");
    const proofSnapshot = marketingSiteSnapshotSchema.parse(
      JSON.parse(await fs.readFile(result.dataFile, "utf8")),
    );
    const latestManifest = await readLatestManifest(runtimeConfig);

    expect(latestManifest.runId).toBe(result.snapshot.run.runId);
    expect(proofSnapshot.spotlightListings).toHaveLength(3);
    expect(proofSnapshot.comparableExample.comparables).toHaveLength(2);
    expect(html).toContain('content="MAL React + TypeScript static renderer"');
    expect(html).toContain("Mallorca acquisition radar");
    expect(html).toContain('id="product-proof"');
    expect(html).toContain("Sea-view apartment in Portixol");
    expect(html).toContain("Book the walkthrough");
    expect(html).toContain(result.snapshot.run.runId);
    expect(css).toContain(".hero-stage");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("scroll-behavior: auto;");
    expect(css).toContain(".listing-row:hover");
  });
});
