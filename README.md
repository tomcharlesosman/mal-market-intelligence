# MAL Market Intelligence

Thin vertical slice for Mallorca real estate market intelligence. The first default is a single TypeScript service with explicit schemas, auditable ingestion runs, and a small CLI that proves the ingest-to-summary path before adding more infrastructure.

## Why this shape

- One runtime path keeps the bootstrap reversible and cheap to change.
- Run-scoped artifacts under `.mal/` make every ingest auditable.
- Domain schemas are the contract that later ingestion, storage, and UI work can share.

## Current scope

- Explicit schemas for raw listings, normalized listings, manifests, and audit events.
- File-backed ingestion run storage with both global and per-run audit logs.
- An Idealista-shaped Mallorca fixture connector that stores the source snapshot, raw records, normalized records, and skip reasons.
- A market intelligence report command that exposes supply cohorts, pricing medians, and ranked comparable listings from the latest run.
- A generated static launch page in `dist/site/` that turns the latest audited Mallorca run into a public-facing landing page with proof JSON.
- Build, typecheck, and tests.

## Layout

```text
fixtures/                  Sample Mallorca listings used to validate the skeleton
src/
  cli.ts                   Runnable commands
  config.ts                Runtime paths and defaults
  domain/listing.ts        Core listing, manifest, and audit schemas
  ingestion/idealista-fixture.ts
                           First Mallorca source adapter using a fixture snapshot
  ingestion/run-store.ts   Shared run artifact and audit helpers
  intelligence/market-summary.ts
  site/marketing-site.ts   Static landing page generator backed by the latest run
test/                      Focused unit tests for normalization and summaries
```

Generated run artifacts are written to `.mal/` by default:

```text
.mal/
  audit/ingestion.ndjson
  runs/<run-id>/
    audit.ndjson
    source-snapshot.json
    raw/*.json
    normalized/listings.ndjson
    manifest.json
dist/site/
  index.html               Generated landing page
  styles.css               Page styling
  market-proof.json        Machine-readable proof snapshot used by the page
```

## Commands

```bash
npm install
npm run typecheck
npm test
npm run ingest:idealista
npm run report:latest
npm run report:latest -- --json
npm run build:site
npm run preview:site
```

To wire a real CTA target before publishing:

```bash
MAL_SITE_CTA_URL="mailto:team@example.com?subject=Mallorca%20radar" npm run build:site
```

## Durable publish flow

The current durable default is GitHub Pages serving the tracked `docs/` directory from `main`. This keeps hosting tied to the repo and avoids CI token requirements or another hosting account.

1. Set `MAL_SITE_CTA_URL` and `MAL_SITE_CTA_LABEL`.
2. Rebuild the site into `docs/`.
3. Commit and push `main`.
4. Configure GitHub Pages to serve from `main` and `/docs`.

```bash
export MAL_SITE_CTA_URL="mailto:team@example.com?subject=MAL%20Mallorca%20brief"
export MAL_SITE_CTA_LABEL="Request the Mallorca brief"
npm run build:site:pages
git add docs
git commit -m "Refresh published landing page"
git push origin main
```

Operational notes:

- `build:site:pages` uses the same CTA env names as the local build and writes the published artifact set into `docs/`.
- GitHub Pages is the first managed path because it keeps hosting tied to the repo and stays up without an operator-held tunnel.
- The temporary localhost preview flow below still exists for fast manual checks before a push.

## Preview flow

The smallest reversible default is a static local preview plus an HTTPS tunnel. This keeps the landing page public without adding new infrastructure before the hosting choice is locked.

1. Set the final CTA target and label.
2. Rebuild the site.
3. Serve `dist/site/` locally.
4. Expose the local port through `localhost.run`.
5. Keep both long-running commands alive while the page should stay public.

```bash
export MAL_SITE_CTA_URL="mailto:team@example.com?subject=MAL%20Mallorca%20brief"
export MAL_SITE_CTA_LABEL="Request the Mallorca brief"
npm run build:site
npm run preview:site
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:localhost:4173 nokey@localhost.run
```

Operational notes:

- `preview:site` serves the generated `dist/site/` directory on port `4173`.
- `localhost.run` prints the public HTTPS URL after the SSH tunnel connects.
- This path is intentionally temporary. The public URL disappears when either long-running process stops.
- The next managed-hosting step should move the same `dist/site/` output to Render static hosting once a Render workspace is explicitly selected and a Git-backed repo exists.

## Runtime conventions

- `MAL_DATA_DIR` controls where auditable run artifacts are written.
- `MAL_SITE_OUTPUT_DIR` overrides the website output folder. Default: `dist/site`.
- `MAL_SITE_CTA_URL` and `MAL_SITE_CTA_LABEL` control the website CTA without code changes.
- Each ingestion run gets its own immutable directory.
- The first reversible default is an Idealista-shaped local snapshot rather than a live connector.
- Normalized records always retain `rawRecordPath` and `rawRecordSha256` so later analytics can trace back to the source snapshot.
- Skipped records stay in the raw artifact set and are logged with explicit reasons in the audit trail.
- `report-latest` now supports a machine-readable `--json` mode for downstream consumers and audit-friendly inspection.
- `build:site` reuses the latest valid run and seeds one from the fixture automatically if no run exists yet.

## Next issues

- `MAL-6`: build the first user-facing intelligence surface on top of the normalized listing and summary outputs.
- Future ingestion work: replace the fixture connector with live source collection once the CEO locks the first source set in [MAL-3](/MAL/issues/MAL-3).
