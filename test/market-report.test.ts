import { describe, expect, it } from "vitest";

import { normalizedListingSchema } from "../src/domain/listing.js";
import { buildMarketIntelligenceReport } from "../src/intelligence/market-summary.js";

function createListing(overrides: Record<string, unknown> = {}) {
  return normalizedListingSchema.parse({
    listingId: "idealista:PALMA-001",
    source: "idealista",
    externalId: "PALMA-001",
    capturedAt: "2026-03-26T08:00:00.000Z",
    listingUrl: "https://example.com/listings/palma-001",
    title: "Subject listing",
    municipality: "Palma",
    neighborhood: "Portixol",
    operation: "sale",
    propertyType: "apartment",
    askingPriceEur: 1000000,
    bedrooms: 3,
    builtAreaSqm: 100,
    rawRecordPath: "runs/seed-1/raw/PALMA-001.json",
    rawRecordSha256:
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    ...overrides,
  });
}

describe("buildMarketIntelligenceReport", () => {
  it("adds supply cohorts and deterministic comparable views", () => {
    const report = buildMarketIntelligenceReport(
      [
        createListing(),
        createListing({
          listingId: "idealista:PALMA-002",
          externalId: "PALMA-002",
          listingUrl: "https://example.com/listings/palma-002",
          title: "Best same-submarket comp",
          askingPriceEur: 1020000,
          builtAreaSqm: 102,
          rawRecordPath: "runs/seed-1/raw/PALMA-002.json",
        }),
        createListing({
          listingId: "idealista:PALMA-003",
          externalId: "PALMA-003",
          listingUrl: "https://example.com/listings/palma-003",
          title: "Same municipality but different type",
          neighborhood: "Santa Catalina",
          propertyType: "townhouse",
          askingPriceEur: 980000,
          builtAreaSqm: 98,
          rawRecordPath: "runs/seed-1/raw/PALMA-003.json",
        }),
        createListing({
          listingId: "idealista:CALVIA-001",
          externalId: "CALVIA-001",
          listingUrl: "https://example.com/listings/calvia-001",
          title: "Different municipality comp",
          municipality: "Calvia",
          neighborhood: "Santa Ponsa",
          askingPriceEur: 1000000,
          builtAreaSqm: 100,
          rawRecordPath: "runs/seed-1/raw/CALVIA-001.json",
        }),
        createListing({
          listingId: "idealista:PALMA-RENT-001",
          externalId: "PALMA-RENT-001",
          listingUrl: "https://example.com/listings/palma-rent-001",
          title: "Rent listing should not appear in sale comps",
          operation: "rent",
          askingPriceEur: 4500,
          builtAreaSqm: 100,
          rawRecordPath: "runs/seed-1/raw/PALMA-RENT-001.json",
        }),
      ],
      { maxComparables: 3 },
    );

    expect(report.summary.listingCount).toBe(5);
    expect(report.cohorts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cohortKey: "sale:palma:apartment",
          listingCount: 2,
          municipality: "Palma",
          operation: "sale",
          propertyType: "apartment",
        }),
        expect.objectContaining({
          cohortKey: "rent:palma:apartment",
          listingCount: 1,
          municipality: "Palma",
          operation: "rent",
          propertyType: "apartment",
        }),
      ]),
    );

    const subjectComparableSet = report.comparableSets.find(
      (set) => set.subject.listingId === "idealista:PALMA-001",
    );

    expect(subjectComparableSet).toBeDefined();
    expect(subjectComparableSet?.comparables.map((comparable) => comparable.listingId)).toEqual([
      "idealista:PALMA-002",
      "idealista:PALMA-003",
      "idealista:CALVIA-001",
    ]);
    expect(subjectComparableSet?.comparables[0]?.matchSignals).toEqual({
      sameMunicipality: true,
      sameNeighborhood: true,
      samePropertyType: true,
      sameBedroomCount: true,
      pricePerSqmDeltaPct: 0,
      builtAreaDeltaPct: 2,
    });
    expect(
      report.comparableSets.some(
        (set) => set.subject.listingId === "idealista:PALMA-RENT-001",
      ),
    ).toBe(false);
  });
});
