import type { NormalizedListing } from "../domain/listing.js";

export type MunicipalitySummary = {
  municipality: string;
  listingCount: number;
  medianAskingPriceEur: number;
  medianAskingPricePerSqmEur: number | null;
};

export type MarketSummary = {
  listingCount: number;
  medianAskingPriceEur: number;
  medianAskingPricePerSqmEur: number | null;
  byMunicipality: MunicipalitySummary[];
};

export type CohortSummary = {
  cohortKey: string;
  municipality: string;
  operation: NormalizedListing["operation"];
  propertyType: NormalizedListing["propertyType"];
  listingCount: number;
  medianAskingPriceEur: number;
  medianAskingPricePerSqmEur: number | null;
};

export type ComparableListingDigest = {
  listingId: string;
  title: string;
  municipality: string;
  neighborhood?: string;
  operation: NormalizedListing["operation"];
  propertyType: NormalizedListing["propertyType"];
  askingPriceEur: number;
  askingPricePerSqmEur: number | null;
  builtAreaSqm: number | null;
  bedrooms: number | null;
  listingUrl: string;
  rawRecordPath: string;
  rawRecordSha256: string;
};

export type ComparableMatchSignals = {
  sameMunicipality: boolean;
  sameNeighborhood: boolean;
  samePropertyType: boolean;
  sameBedroomCount: boolean | null;
  pricePerSqmDeltaPct: number | null;
  builtAreaDeltaPct: number | null;
};

export type ComparableListing = ComparableListingDigest & {
  similarityScore: number;
  matchSignals: ComparableMatchSignals;
};

export type ComparableSet = {
  strategyVersion: "v1";
  subject: ComparableListingDigest;
  comparableCount: number;
  comparables: ComparableListing[];
};

export type MarketIntelligenceReport = {
  summary: MarketSummary;
  cohorts: CohortSummary[];
  comparableSets: ComparableSet[];
};

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length === 0) {
    return 0;
  }

  if (sorted.length % 2 === 0) {
    const lower = sorted[middle - 1];
    const upper = sorted[middle];

    if (lower === undefined || upper === undefined) {
      throw new Error("Median calculation failed for an even-sized array.");
    }

    return round((lower + upper) / 2);
  }

  const value = sorted[middle];

  if (value === undefined) {
    throw new Error("Median calculation failed for an odd-sized array.");
  }

  return round(value);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function pricePerSqm(listing: NormalizedListing): number | null {
  if (!listing.builtAreaSqm) {
    return null;
  }

  return round(listing.askingPriceEur / listing.builtAreaSqm);
}

function summarizeGroup(
  municipality: string,
  listings: NormalizedListing[],
): MunicipalitySummary {
  const pricePerSqmValues = listings
    .map(pricePerSqm)
    .filter((value): value is number => value !== null);

  return {
    municipality,
    listingCount: listings.length,
    medianAskingPriceEur: median(listings.map((listing) => listing.askingPriceEur)),
    medianAskingPricePerSqmEur:
      pricePerSqmValues.length > 0 ? median(pricePerSqmValues) : null,
  };
}

export function buildMarketSummary(listings: NormalizedListing[]): MarketSummary {
  const grouped = new Map<string, NormalizedListing[]>();

  for (const listing of listings) {
    const bucket = grouped.get(listing.municipality) ?? [];
    bucket.push(listing);
    grouped.set(listing.municipality, bucket);
  }

  const pricePerSqmValues = listings
    .map(pricePerSqm)
    .filter((value): value is number => value !== null);

  return {
    listingCount: listings.length,
    medianAskingPriceEur: median(listings.map((listing) => listing.askingPriceEur)),
    medianAskingPricePerSqmEur:
      pricePerSqmValues.length > 0 ? median(pricePerSqmValues) : null,
    byMunicipality: [...grouped.entries()]
      .map(([municipality, municipalityListings]) =>
        summarizeGroup(municipality, municipalityListings),
      )
      .sort((left, right) => left.municipality.localeCompare(right.municipality)),
  };
}

function buildCohortKey(listing: NormalizedListing): string {
  return [
    listing.operation,
    listing.municipality.toLowerCase(),
    listing.propertyType,
  ].join(":");
}

function summarizeCohort(cohortKey: string, listings: NormalizedListing[]): CohortSummary {
  const [firstListing] = listings;

  if (!firstListing) {
    throw new Error(`Cannot summarize empty cohort ${cohortKey}.`);
  }

  const pricePerSqmValues = listings
    .map(pricePerSqm)
    .filter((value): value is number => value !== null);

  return {
    cohortKey,
    municipality: firstListing.municipality,
    operation: firstListing.operation,
    propertyType: firstListing.propertyType,
    listingCount: listings.length,
    medianAskingPriceEur: median(listings.map((listing) => listing.askingPriceEur)),
    medianAskingPricePerSqmEur:
      pricePerSqmValues.length > 0 ? median(pricePerSqmValues) : null,
  };
}

function toComparableListingDigest(
  listing: NormalizedListing,
): ComparableListingDigest {
  return {
    listingId: listing.listingId,
    title: listing.title,
    municipality: listing.municipality,
    ...(listing.neighborhood ? { neighborhood: listing.neighborhood } : {}),
    operation: listing.operation,
    propertyType: listing.propertyType,
    askingPriceEur: listing.askingPriceEur,
    askingPricePerSqmEur: pricePerSqm(listing),
    builtAreaSqm: listing.builtAreaSqm ?? null,
    bedrooms: listing.bedrooms ?? null,
    listingUrl: listing.listingUrl,
    rawRecordPath: listing.rawRecordPath,
    rawRecordSha256: listing.rawRecordSha256,
  };
}

function percentDelta(
  baseline: number | null | undefined,
  candidate: number | null | undefined,
): number | null {
  if (!baseline || candidate === null || candidate === undefined) {
    return null;
  }

  return round((Math.abs(candidate - baseline) / baseline) * 100);
}

function buildComparableListing(
  subject: NormalizedListing,
  candidate: NormalizedListing,
): ComparableListing {
  const subjectPricePerSqm = pricePerSqm(subject);
  const candidatePricePerSqm = pricePerSqm(candidate);
  const pricePerSqmDeltaPct = percentDelta(subjectPricePerSqm, candidatePricePerSqm);
  const builtAreaDeltaPct = percentDelta(
    subject.builtAreaSqm ?? null,
    candidate.builtAreaSqm ?? null,
  );
  const sameMunicipality = subject.municipality === candidate.municipality;
  const sameNeighborhood =
    subject.neighborhood !== undefined &&
    candidate.neighborhood !== undefined &&
    subject.neighborhood === candidate.neighborhood;
  const samePropertyType = subject.propertyType === candidate.propertyType;
  const sameBedroomCount =
    subject.bedrooms !== undefined && candidate.bedrooms !== undefined
      ? subject.bedrooms === candidate.bedrooms
      : null;
  const fallbackPriceDeltaPct = percentDelta(
    subject.askingPriceEur,
    candidate.askingPriceEur,
  );

  let similarityScore = 0;

  if (!sameMunicipality) {
    similarityScore += 40;
  }

  if (sameMunicipality && !sameNeighborhood) {
    similarityScore += 5;
  }

  if (!samePropertyType) {
    similarityScore += 20;
  }

  if (sameBedroomCount === null) {
    similarityScore += 2;
  } else if (!sameBedroomCount) {
    similarityScore += Math.min(
      Math.abs((subject.bedrooms ?? 0) - (candidate.bedrooms ?? 0)) * 5,
      15,
    );
  }

  similarityScore += pricePerSqmDeltaPct ?? fallbackPriceDeltaPct ?? 25;
  similarityScore += (builtAreaDeltaPct ?? 10) / 2;

  return {
    ...toComparableListingDigest(candidate),
    similarityScore: round(similarityScore),
    matchSignals: {
      sameMunicipality,
      sameNeighborhood,
      samePropertyType,
      sameBedroomCount,
      pricePerSqmDeltaPct,
      builtAreaDeltaPct,
    },
  };
}

function buildComparableSet(
  subject: NormalizedListing,
  listings: NormalizedListing[],
  maxComparables: number,
): ComparableSet | null {
  const comparables = listings
    .filter(
      (candidate) =>
        candidate.listingId !== subject.listingId &&
        candidate.operation === subject.operation,
    )
    .map((candidate) => buildComparableListing(subject, candidate))
    .sort((left, right) => {
      if (left.similarityScore !== right.similarityScore) {
        return left.similarityScore - right.similarityScore;
      }

      return left.listingId.localeCompare(right.listingId);
    })
    .slice(0, maxComparables);

  if (comparables.length === 0) {
    return null;
  }

  return {
    strategyVersion: "v1",
    subject: toComparableListingDigest(subject),
    comparableCount: comparables.length,
    comparables,
  };
}

export function buildMarketIntelligenceReport(
  listings: NormalizedListing[],
  options: { maxComparables?: number } = {},
): MarketIntelligenceReport {
  const summary = buildMarketSummary(listings);
  const grouped = new Map<string, NormalizedListing[]>();

  for (const listing of listings) {
    const cohortKey = buildCohortKey(listing);
    const bucket = grouped.get(cohortKey) ?? [];
    bucket.push(listing);
    grouped.set(cohortKey, bucket);
  }

  const cohorts = [...grouped.entries()]
    .map(([cohortKey, cohortListings]) => summarizeCohort(cohortKey, cohortListings))
    .sort((left, right) => {
      const municipalityOrder = left.municipality.localeCompare(right.municipality);

      if (municipalityOrder !== 0) {
        return municipalityOrder;
      }

      const operationOrder = left.operation.localeCompare(right.operation);

      if (operationOrder !== 0) {
        return operationOrder;
      }

      return left.propertyType.localeCompare(right.propertyType);
    });

  const comparableSets = listings
    .map((listing) => buildComparableSet(listing, listings, options.maxComparables ?? 3))
    .filter((set): set is ComparableSet => set !== null);

  return {
    summary,
    cohorts,
    comparableSets,
  };
}
