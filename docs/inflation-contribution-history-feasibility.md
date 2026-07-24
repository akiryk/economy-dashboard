# Historical inflation-contribution data feasibility

Status: **Story 46 Outcome A — curated collection enabled**

Updated: July 24, 2026

## Decision

Use manually downloaded official BLS archived HTML releases with the
repository's deterministic local parser. Direct repository retrieval remains
unreliable, so this is deliberately a semi-automated workflow rather than live
scraping. It retains the official file as the input, selects the Table 7 effect
column structurally, derives Other services, checks reconciliation and
provenance, and emits one normalized staging record.

This resolves the source-method blocker. Story 47 may collect and independently
audit the full five-year production history using this workflow. This story
does not create that history or change the UI. Category inflation rates remain
invalid substitutes for contribution effects.

## Monthly collection workflow

1. Find the measured month's release on the official
   [BLS CPI archive](https://www.bls.gov/bls/news-release/cpi.htm). Do not infer
   a URL from a calendar date.
2. In a browser, save the official archived HTML release locally. Repository
   command-line and headless-browser requests have returned BLS access-denied
   responses, so the manual acquisition step is required.
3. Run the parser with the measured period, release date, exact archive URL,
   local source file, and a temporary staging destination:

   ```bash
   npm run data:ingest-inflation-contribution -- \
     --file /path/to/cpi-release.html \
     --period 2026-06-01 \
     --release-date 2026-07-14 \
     --source-url https://www.bls.gov/news.release/archives/cpi_07142026.htm \
     --output /tmp/inflation-contribution-2026-06.json
   ```

   Omit `--output` to inspect the normalized record on standard output.
4. Review the output against the official Table 7 cells. Confirm the measured
   month, release date, URL, five source effects, derived Other services, and
   reconciliation residual.
5. Before adding the record to a collection, independently inspect the source a
   second time. Story 47 owns the production merge and full-history audit.

The parser accepts archived BLS HTML only. It requires the CPI-U Table 7
12-month heading and the ordered columns `Expenditure category`, `Relative
importance`, `Unadjusted percent change`, and `Unadjusted effect on All Items`.
It rejects missing or duplicate categories, reordered or ambiguous columns,
non-numeric effects, source-period conflicts, unofficial URLs, URL/release-date
conflicts, duplicate periods, and October 2025. Parsing and validation finish
before an output file is atomically replaced, so a failed run preserves prior
valid output.

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
  sourceFile: string
  vintage: 'release'
  reconciliationResidual: number
  reconciliationStatus: 'reconciled'
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

### Curated official-source HTML ingestion

A manually acquired archive can be parsed locally without transcribing its
numeric cells into JSON. The repository now validates one official HTML file at
a time and retains its file identity, release URL, and release date. Collecting
roughly 60 files and independently reviewing the normalized records remains
Story 47 work. No proof-of-concept values are promoted to production here.

Result: selected collection method.

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
  research fetch returned an internal retrieval error. Story 47 can obtain it
  through the same explicit browser-download step as other archived releases.

The samples demonstrate that the desired effects exist and that the category
derivation and repository-safe local ingestion mechanism work. They do not
constitute the production history.

## Implemented validation

The local parser:

- matches the exact Table 7 heading and measured period;
- matches exact category labels and rejects duplicates or unknown substitutions;
- reads the unadjusted effect column, never the adjacent percent-change column;
- preserves negative signs and three-decimal source precision;
- requires release date, release URL, and `vintage: 'release'`;
- derives Other services only after both inputs validate;
- rejects duplicate or unsorted periods;
- preserves October 2025 as missing;
- reconciles the five mutually exclusive effects to headline CPI using the
  existing 0.05-percentage-point tolerance;
- fails atomically so an invalid update cannot replace committed valid data.

Archived observations must be described as release-vintage values. The BLS
archive warns that archived releases may differ from later revised data; they
must not be described as one consistently revised historical vintage.

## Proof-of-concept fixtures and review

Compact nonproduction HTML fixtures preserve the required rows and adjacent
percent-change/effect columns from official releases. They are parser tests,
not a historical dataset. Manual cell-by-cell review produced:

| Measured month | Release date | Food | Energy | Goods ex. food and energy | Services ex. energy | Shelter | Other services | Residual |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| June 2023 | 2023-07-12 | 0.762 | −1.556 | 0.291 | 3.472 | 2.553 | 0.919 | +0.031 |
| September 2025 | 2025-10-24 | 0.423 | 0.176 | 0.315 | 2.099 | 1.272 | 0.827 | −0.013 |
| November 2025 | 2025-12-18 | 0.362 | 0.264 | 0.276 | 1.834 | 1.079 | 0.755 | −0.036 |
| June 2026 | 2026-07-14 | 0.410 | 1.051 | 0.158 | 1.912 | 1.159 | 0.753 | −0.031 |

June 2023 supplies the older structure and negative-contribution case; the 2025
and 2026 files cover later releases. September and November 2025 are explicit.
The BLS archive states that October 2025 was not published because of the
appropriations lapse. The collection validator prohibits creating that period.

Tests also cover missing and duplicate categories, malformed numbers, an
unexpected heading, changed column order, an unavailable marker, source-period
mismatch, duplicate months, retrieval failure, provenance failures, exact
reconciliation tolerance, outside-tolerance failure, and prior-output
preservation.

## Readiness

Historical production coverage committed by this story: **none**.

Known missing production period: **October 2025**.

Vintage policy if later implemented from archives: **one release vintage per
observation**.

Production history collection: **unblocked for Story 47**.

Mini-trend visualization status: **still deferred until Story 47 creates and
audits the production history**.
