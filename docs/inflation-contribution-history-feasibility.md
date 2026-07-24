# Historical inflation-contribution data feasibility

Status: **Outcome B — not yet feasible**

Date: July 23, 2026

## Decision

Do not create a production five-year contribution-history dataset yet. The
official archived CPI releases contain the required percentage-point effects,
and bounded manual inspection confirms that the desired category mapping is
possible. However, the repository cannot currently retrieve the archive
reliably enough to support an automated ingestion path, and a complete curated
snapshot has not received the two-pass transcription and validation required
for production use.

The later mini-trend visualization remains blocked. Category inflation rates
must not be substituted for contribution effects.

## Required production schema

A future production observation must retain source fields rather than display
strings:

```ts
interface HistoricalInflationContributionObservation {
  period: string
  headlineCpiEffectTotal: number | null
  food: number | null
  energy: number | null
  shelter: number | null
  commoditiesLessFoodAndEnergy: number | null
  servicesLessEnergyServices: number | null
  otherServices: number | null
  sourceReleaseDate: string | null
  sourceUrl: string
  vintage: 'release'
}
```

`otherServices` is derived without intermediate rounding:

```text
servicesLessEnergyServices − shelter
```

Periods must be unique and sorted. Missing source effects remain `null`.
October 2025 must be represented as an explicit gap and must never be
interpolated or carried forward.

## Official sources investigated

### Machine-readable BLS data and supplemental files

The BLS public CPI series and downloadable time-series files provide component
indexes and percent changes, but no simple monthly series for the Table 7
“Unadjusted effect on All Items” field required here. Annual relative-importance
files do not by themselves provide the published monthly effects. Reconstructing
effects from indexes and weights would require a separate methodology project,
including treatment of weight updates and validation against published effects.

Result: not a direct source for this story.

### Archived CPI HTML releases

The official archive index lists one HTML release per measured month. Table 7
contains the required expenditure-category label, 12-month percent change, and
12-month effect columns. Semantic labels are present across the inspected 2023,
2025, and 2026 releases, but a parser must distinguish the effect column from
the adjacent category percent-change column and reject changed or ambiguous
structure.

Repository command-line retrieval with `curl` returned the BLS “Access Denied”
page. A local headless Chromium request was denied as well. Research tooling
could inspect indexed pages interactively, but that is not a reproducible
repository refresh mechanism.

Result: correct official content, currently unreliable for automated ingestion.

### Archived PDFs and spreadsheets

The archive index exposes a PDF alongside each HTML release. This avoids
depending solely on HTML markup but still requires deterministic archive
discovery, reliable downloads, and table extraction across roughly 60 files.
No stable bulk supplemental file containing the five-year effect history was
found. PDF extraction would add more column-layout ambiguity than the HTML
tables and was not justified after retrieval blocking was confirmed.

Result: possible fallback input, not a maintainable ingestion path yet.

### Curated official-source snapshot

A curated snapshot is technically possible. It would require approximately 60
release URLs and about 300 source-effect transcriptions, followed by an
independent second pass. The current two-observation snapshot does not establish
that larger workflow. No partial proof-of-concept values are being promoted to
production.

Result: viable only as a separately approved, carefully reviewed collection
project.

## Bounded proof of concept

Manual source inspection established the following:

- **June 2026:** Table 7 reports headline CPI at 3.5%, Food effect `0.410`,
  Energy `1.051`, Commodities less food and energy `0.158`, Services less
  energy services `1.912`, and Shelter `1.159`. Derived Other services is
  `0.753`. The five mutually exclusive effects sum to `3.531`, leaving the
  documented `−0.031`-point residual versus headline CPI.
- **June 2023:** Table 7 reports headline CPI at 3.0%, Food `0.762`, Energy
  `−1.556`, Commodities less food and energy `0.291`, Services less energy
  services `3.472`, and Shelter `2.553`. Derived Other services is `0.919`.
  The five effects sum to `2.969`, leaving a `+0.031`-point residual. This
  sample confirms sign preservation and a materially negative contribution.
- **September 2025:** the archive contains a normal Table 7 after the same
  semantic heading and reports Food effect `0.423`; manual inspection confirms
  that the category percent-change and effect columns remain distinct.
- **November 2025:** the release exists, while its tables explicitly mark
  October and November monthly index values unavailable because of the
  appropriations lapse. Its 12-month Table 7 effects remain separately
  published—for example Services less energy services `1.834` and Shelter
  `1.079`. This does not create an October 2025 observation.
- **October 2025:** the archive index explicitly says the release was not
  published. It must remain missing.
- **June 2021:** the archive index identifies the official release, but the
  research fetch returned an internal retrieval error. That failure reinforces
  the need for a deterministic approved archive-access path before attempting
  full-window ingestion.

The samples demonstrate that the desired effects exist and that the category
derivation is meaningful. They do not demonstrate a repository-safe retrieval
mechanism.

## Validation required before Outcome A

Any later parser or curated ingestion must:

- match the exact Table 7 heading and measured period;
- match exact category labels and reject duplicates or unknown substitutions;
- read the unadjusted effect column, never the adjacent percent-change column;
- preserve negative signs and three-decimal source precision;
- require release date, release URL, and `vintage: 'release'`;
- derive Other services only after both inputs validate;
- reject duplicate or unsorted periods;
- preserve October 2025 as missing;
- reconcile the five mutually exclusive effects to headline CPI using the
  existing 0.05-percentage-point tolerance;
- fail atomically so an invalid update cannot replace committed valid data.

Archived observations must be described as release-vintage values. The BLS
archive warns that archived releases may differ from later revised data; they
must not be described as one consistently revised historical vintage.

## Recommended next data-engineering approach

Create a narrowly scoped retrieval-enablement story before collecting the full
history:

1. Ask BLS whether Table 7 effects have an official bulk or machine-readable
   endpoint not exposed in the public CPI series catalog.
2. If none exists, obtain an approved archive-access method and build an
   explicit release manifest rather than guessing release-date URLs.
3. Implement an HTML parser against small committed fixtures covering 2023,
   September 2025, November 2025, and 2026 structures.
4. Add structural, numeric, provenance, gap, reconciliation, and atomic-write
   tests before making any live retrieval part of a refresh.
5. Only then ingest and independently audit the full five-year window.

If reliable automated archive access remains unavailable, propose a separate
curated-snapshot story with an explicit two-person or two-pass verification
budget. Do not fold manual collection into a visualization story.

## Readiness

Historical coverage committed by this story: **none**.

Known missing production period: **October 2025**.

Vintage policy if later implemented from archives: **one release vintage per
observation**.

Mini-trend visualization status: **blocked pending a validated production
history**.
