# Tests must be invariant to data refreshes

This test-only maintenance item fixes valid economic-data refreshes being
rejected by release-sensitive assertions. Dashboard components, provider
clients, workflows, and committed datasets are unchanged.

## Audit and decisions

The audit covered the full suite, including direct JSON imports, repository
loads, page composition, and script tests that read committed artifacts.

- `CompactHistoricalMetricChart` now mocks interaction with the model's latest
  observation. Saving-rate comparisons use the exact prior-year observation;
  payroll, budget, ownership, housing, and manufacturing expectations use
  the supplied model and paired data. Independent controlled saving fixtures
  verify current-value revisions, prior-value revisions, and missing prior data.
- Research-page expectations derive fiscal/trade state and CPI/PCE interpretation
  from their datasets. Fixed navigation titles remain assertions about UI
  configuration. Secondary-page capacity interpretation uses its formatter.
- The CPI repository tests no longer require an old source gap to remain null.
  The comparison page no longer requires a missing OECD observation to persist.
  Controlled gap and unavailable-peer tests remain.
- Breakeven tests retain runtime validation and arithmetic reconciliation without
  pinning published benchmark numbers or a repository's current gap/availability.
  Their synthetic gap stays within the current displayed window, and format
  assertions allow negative growth with the formatter's minus sign.
- Distribution validation fixtures explicitly own their tested statuses.
  Briefing composition no longer requires production inputs to stay fresh.
  Chart summaries derive whether their production observations are below zero.
- Other production-data tests retain dataset-derived expectations and structural,
  chronology, coverage, metadata, and transformation checks. Historical payroll
  cases remain explicitly named regressions. Controlled domain, validation,
  formatting, chart-option, ingestion, and component tests remain intact.

The compact-chart policy check detects the demonstrated literal tooltip/latest
value pattern only in tests that consume production JSON. It permits exact
controlled-fixture assertions and fixed threshold configuration. Old rejected
strings appear in policy-test fixtures solely to verify rejection.

## Forward verification

The baseline passed 137 files and 1,154 tests. Before the fix, temporarily adding
0.9 to the June 2025 personal-saving observation reproduced the reported failure:
the tooltip displayed −2.8 while its assertion expected −1.9 percentage points.

After the fix, the full suite passed 137 files and 1,165 tests with simultaneous
temporary revisions to 14 committed JSON datasets:

- Personal saving: revised the prior-year and latest values and appended the next
  monthly observation.
- Payroll: negative latest average and monthly change.
- Federal budget and trade balance: latest values switched to surplus.
- Ownership cost share: crossed below the affordability threshold.
- Housing starts and manufacturing output: revised latest source levels.
- Capacity utilization: crossed above its historical reference.
- Core CPI: moved above headline CPI; PCE: moved exactly to the 2% target.
- Shelter, energy, and food CPI: filled the old October 2025 null observations.

The extended acceptance run also changes the breakeven comparison to negative
rates and counts, revises a published benchmark, changes distribution statuses,
fills all missing OECD peers, and advances both LMCI retrieval dates. These
exercise 20 datasets in total, including the latest repository/policy changes.
The extended full suite passed all 137 files and 1,166 tests.

All temporary JSON edits were restored byte for byte before canonical verification
and commit. No simulated observations are published. Changes to policy coverage
are also checked by the final full suite.

Every changed assertion was reviewed for fixture ownership, dataset-derived or
structural expectations, normal refresh advancement, and compliance with
`LEARNINGS.md`. Future tests should follow the same rule: a valid source revision
is an input to verify, not an error to reject.

Final `npm run verify` passed lint, typecheck, test policy, all 137 test files /
1,166 tests, and the production build against the restored datasets.
`git diff --check` also passed. The build retains its existing chunk-size advisory;
this test-only change does not alter production assets or dependencies.
