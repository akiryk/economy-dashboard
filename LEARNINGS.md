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
