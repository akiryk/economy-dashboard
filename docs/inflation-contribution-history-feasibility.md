# Historical inflation-contribution ingestion

Updated: July 24, 2026

## Official source

Use the BLS
[Archived Consumer Price Index Supplemental Files](https://www.bls.gov/cpi/tables/supplemental-files/)
page. It states that current-year files are available individually by month,
previous years are annual compressed archives, and archived files may differ
from subsequently revised data. The production history is therefore a
collection of release vintages, not a consistently revised time series.

The required inputs for June 2021 through June 2026 are:

- `archive-2021.zip` through `archive-2024.zip`;
- `news-release-table7-YYYYMM.xlsx` for January–December 2025 except October;
- `news-release-table7-YYYYMM.xlsx` for January–June 2026.

Only June–December Table 7 workbooks are ingested from the 2021 archive.
October 2025 is represented explicitly as unavailable with reason `2025
appropriations lapse`; it is never estimated, interpolated, or carried forward.

## Fields and validation

The parser reads the 12-month `Unadjusted effect on All Items` cells for Food,
Energy, Shelter, Commodities less food and energy commodities, and Services
less energy services. It separately reads the All items 12-month percent change
only as the reconciliation total. Category percent-change cells are never used.

```text
Other services = Services less energy services − Shelter
```

Before writing output, ingestion requires:

- exactly one worksheet with the CPI-U Table 7 12-month heading;
- a measured month matching both metadata and
  `news-release-table7-YYYYMM.xlsx`;
- one unambiguous percent-change column and one unambiguous effect column;
- exactly one row for every required category;
- native numeric effect cells with signs preserved;
- an official matching BLS individual-workbook or annual-archive URL;
- a release date after the measured month;
- unique, ascending periods;
- a five-category sum within 0.05 percentage point of headline CPI.

Other services is calculated from the source numeric values without
intermediate rounding. The source workbook name, official URL, measured month,
release date, residual, and `vintage: "release"` are retained. A failure occurs
before the atomic output replacement, preserving prior valid output.

## One-workbook workflow

Download an individual workbook from the official supplemental-files page:

```bash
npm run data:ingest-inflation-contribution -- \
  --file /path/to/news-release-table7-202606.xlsx \
  --period 2026-06-01 \
  --release-date 2026-07-14 \
  --source-url https://www.bls.gov/cpi/tables/supplemental-files/news-release-table7-202606.xlsx \
  --output /tmp/inflation-contribution-2026-06.json
```

Omit `--output` to inspect the record on standard output.

## Full-history workflow

Place the four ZIPs and 17 individual workbooks in one local directory. Create
a JSON release-date manifest keyed by measured period, for example:

```json
{
  "2021-06-01": "2021-07-13",
  "2026-06-01": "2026-07-14"
}
```

The real manifest must contain every requested measured period except October
2025 and no additional periods. Run:

```bash
npm run data:ingest-inflation-contribution-history -- \
  --source-directory /path/to/bls-supplemental-files \
  --release-dates /path/to/release-dates.json \
  --output /path/to/inflation-contribution-history.json
```

The command requires all 12 Table 7 workbooks in each annual archive to validate
archive identity, but ingests only the requested target months. Other tables and
supplemental workbooks in each ZIP are ignored.

## Production result

Story 47 ingested all required official files and generated
`src/features/economic-series/data/inflation-contribution-history.json`.
Coverage is June 2021 through June 2026:

- 61 measured-month entries;
- 60 validated release-vintage observations;
- one explicit October 2025 unavailable entry;
- residual range −0.050 to +0.048 percentage point;
- 25 months with a negative Energy effect;
- 16 months with a negative Commodities less food and energy effect.

Real-workbook validation confirmed two BLS header layouts. Some workbooks repeat
merged header values on adjacent rows; others split the merged header across
rows. The parser combines only the three header rows anchored by `Expenditure
category`, then still requires exactly one percent-change column and one effect
column. It also normalizes Excel rich-text runs used for footnote markers.

The committed release-date manifest is
`scripts/bls/inflationContributionReleaseDates.json`. Its dates come from the
official archived CPI release URLs and exclude October 2025. Direct automated
BLS downloads may return an `Access Denied` page, so browser download remains an
explicit acquisition step; all parsing and production generation after download
are deterministic.

The historical dataset is ready for a later mini-trend visualization story.
That later UI must preserve the internal October 2025 gap and must not connect,
interpolate, or carry values across it.
