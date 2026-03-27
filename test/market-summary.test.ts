import { describe, expect, it } from "vitest";

import { normalizedListingSchema } from "../src/domain/listing.js";
import { buildMarketSummary } from "../src/intelligence/market-summary.js";

function createListing(overrides: Record<string, unknown> = {}) {
  return normalizedListingSchema.parse({
    listingId: "idealista:PALMA-BASE",
    source: "idealista",
    externalId: "PALMA-BASE",
    capturedAt: "2026-03-26T08:00:00.000Z",
    listingUrl: "https://example.com/listings/palma-base",
    title: "Base listing",
    municipality: "Palma",
    operation: "sale",
    propertyType: "apartment",
    askingPriceEur: 900000,
    builtAreaSqm: 100,
    rawRecordPath: "runs/seed-1/raw/PALMA-BASE.json",
    rawRecordSha256:
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    ...overrides,
  });
}

describe("buildMarketSummary", () => {
  it("computes median pricing overall and by municipality", () => {
    const summary = buildMarketSummary([
      createListing({
        listingId: "idealista:PALMA-001",
        externalId: "PALMA-001",
        askingPriceEur: 950000,
        builtAreaSqm: 118,
      }),
      createListing({
        listingId: "idealista:CALVIA-002",
        externalId: "CALVIA-002",
        municipality: "Calvia",
        propertyType: "villa",
        askingPriceEur: 2350000,
        builtAreaSqm: 312,
      }),
      createListing({
        listingId: "idealista:PALMA-003",
        externalId: "PALMA-003",
        askingPriceEur: 1250000,
        builtAreaSqm: 186,
      }),
    ]);

    expect(summary.listingCount).toBe(3);
    expect(summary.medianAskingPriceEur).toBe(1250000);
    expect(summary.byMunicipality).toEqual([
      {
        municipality: "Calvia",
        listingCount: 1,
        medianAskingPriceEur: 2350000,
        medianAskingPricePerSqmEur: 7532.05,
      },
      {
        municipality: "Palma",
        listingCount: 2,
        medianAskingPriceEur: 1100000,
        medianAskingPricePerSqmEur: 7385.64,
      },
    ]);
  });
});
