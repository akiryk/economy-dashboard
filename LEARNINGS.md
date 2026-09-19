# Engineering learnings

This file records demonstrated repository-specific failure patterns that must
change how future stories are implemented. It is not a changelog. Every
implementation story must use the `economy-dashboard-story` skill and review
this file before editing.

## Mutable production data in tests

**Invariant:** Normal publication of a new observation, value, period, retrieval
date, or ingestion date must not make the test suite fail.

**Observed failure:** Release-sensitive assertions blocked valid economic-data
refreshes in August 2026. A later headline story then reintroduced the same
class of failure by asserting the current successful-ingestion date literally.

**Required prevention:** UI behavior uses controlled fixtures. Tests that
intentionally load committed production data derive current expectations or
assert stable invariants. Exact values are reserved for controlled fixtures and
named historical regressions.

**Executable checks:** Run `npm run test:policy`, audit every changed assertion,
and forward-test every touched mutable input with a plausible next value.

## Generated refresh metadata

**Invariant:** Advancing `lastSuccessfulDataRefreshDate` after a valid refresh
must update the headline without requiring a source or test edit.

**Observed failure:** The workflow advanced the metadata from September 4 to
September 5, 2026, while `DashboardPage.test.tsx` still expected September 4.
Verification rejected valid refreshed data and deployed the failure notice.

**Required prevention:** Test headline formatting with injected, invented dates.
Page-composition tests may assert the heading's stable structure but must not
contain a literal dated `U.S. Economy, Month D, YYYY` expectation.

**Executable checks:** The test-policy script rejects literal dated dashboard
headings in `DashboardPage.test.tsx`; headline component tests must prove that a
second, later fixture date renders without changing production code.

## Passing today's state is not forward verification

**Invariant:** Verification for behavior driven by refreshable inputs must cover
the next valid state, not only the committed state present during development.

**Observed failure:** Story 101 passed lint, typechecking, tests, build, smoke,
and deployment because its hard-coded test happened to match that day's
metadata. The defect appeared only when the next refresh advanced the date.

**Required prevention:** Each story identifies mutable inputs during preflight
and records a forward-change check in its completion report.

**Executable checks:** Controlled tests should exercise at least two successive
valid values when advancement itself is the behavior under test.

## Mutable values can change grammar and stop being unique

**Invariant:** A valid observation may equal another displayed value or cross a
formatting boundary without breaking verification.

**Observed failure:** August 2026 CPI data made the headline-core gap exactly
1.0 percentage point and made two values in the momentum card both display as
3.4%. A page test hard-coded plural grammar for the gap, while another required
the formatted rate to occur only once. After those were repaired, a forward
refresh filled a previously missing CPI index and exposed a third page test
that required that production gap to remain forever. All rejected valid data.

**Required prevention:** Test singular/plural formatting with controlled
fixtures. In production-data composition tests, assert mutable values within a
semantic element and treat surrounding grammar structurally. Never use a
mutable formatted value as a unique page- or card-level selector. Exercise gap
handling with a controlled fixture; production composition tests may branch on
the derived state but must not require a dated source gap to persist.

**Executable checks:** The test-policy script rejects direct
`getByText(formatPercentage(...))` uniqueness assertions and fixed point-unit
grammar around `formatSignedPercentagePoints(...)` in `DashboardPage.test.tsx`.
It also rejects dated production-gap assertions in that file.
Forward fixtures must cover a grammar boundary or duplicate display value when
either can affect touched behavior.

## Refresh failure boundaries must match data dependencies

**Invariant:** A failure in one independently publishable refresh unit must not
discard valid updates from unrelated units, while every genuinely dependent
output must remain atomic.

**Observed failure:** On September 10, 2026, a transient FRED HTTP 502 for
initial unemployment claims caused the main refresh command to exit nonzero.
The workflow discarded successful unrelated work, retained the prior mortgage
observation, and deployed a whole-dashboard warning.

**Required prevention:** Model refresh units, artifacts, dependencies, and
visible freshness mappings explicitly. Partial publication may proceed only
after the complete mixed old/new snapshot passes repository verification.
Skipped units do not count as recovered, and global verification or deployment
failures remain globally blocking.

**Executable checks:** Validate unique artifact ownership, full visible-artifact
coverage, dependency references, and exact unit-to-dataset mappings. Fault-test
both independent and grouped failures before enabling partial publication.

## Match the requested cadence without manufacturing precision

**Invariant:** A timely proxy must retain its source definition; a slow benchmark
must not be interpolated merely to look current.

**Observed risk:** Census publishes contractor-built dollars per square foot
annually, while the product need is monthly or quarterly through 2026. Turning
the annual figure into monthly dollars would conceal the absence of observations
and imply unsupported precision.

**Required prevention:** Prefer an official higher-frequency constant-quality
index when the user asks how costs are changing. Label its scope and exclusions,
keep the annual dollar benchmark separate, and do not splice the two into a
synthetic level.

**Executable checks:** Ingestion tests advance the monthly workbook and revise a
recent observation. UI copy and tests distinguish the monthly index from the
linked annual price-per-square-foot table.

## Match chart semantics to the product question

**Invariant:** A level question must lead with the published level and its path;
a current growth rate is supporting context, not a substitute answer.

**Observed failure:** The first home-construction card led with year-over-year
inflation and charted rate changes. It was technically current but made the
long-run increase in the cost of comparable construction difficult to see.

**Required prevention:** Identify whether each story asks about a level, change,
share, or rate before choosing the headline and chart transformation. Preserve
the source's base and units, explain their meaning, and keep related measures
visibly separate when they have different populations, frequencies, or units.

**Executable checks:** Controlled component tests assert the dominant level,
base label, cumulative derivation, and subordinate changes. Ingestion tests
advance monthly and annual inputs independently, and refresh registry tests
enforce separate artifact ownership and failure boundaries.

## Await the complete lazy-rendered collection

**Invariant:** A composition test that verifies a complete section must wait for
the complete collection, not merely one asynchronously loaded member.

**Observed failure:** A page test awaited the third Prices card, immediately
asserted all five cards, and passed locally only because the remaining lazy work
finished quickly. A slower CI runner correctly exposed the race.

**Required prevention:** When the assertion concerns collection membership or
order, wait for the expected collection length before reading the collection.
Finding one member proves only that member is ready.

**Executable checks:** Dashboard section tests use `waitFor` on the full article
count before asserting membership or order; controlled component tests remain
independent of page-load timing.
