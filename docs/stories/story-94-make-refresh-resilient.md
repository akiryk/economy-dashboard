# User Story: Make Refresh Verification Resilient to Normal Data Advancement

## Goal

As the owner of the U.S. Economy Dashboard, I want the verification suite and refresh pipeline to tolerate normal publication of new economic data so that valid new observations cannot be blocked from production merely because tests assert yesterday’s current value or date.

This story should fix the existing August 19 refresh failure, eliminate the broader class of release-sensitive test brittleness that caused it, establish durable repository guidance, and prove that the application remains correct when datasets advance.

The desired outcome is not simply “make the current tests pass.” It is:

> **Normal provider data advancement must not break verification unless the new data exposes a genuine application, transformation, validation, or rendering defect.**

## Context

The data-operations audit found that the August 19 scheduled refresh successfully retrieved and validated newer provider data, including July housing and manufacturing observations, but verification failed before commit and deployment because tests contained hard-coded release-sensitive display values. Production correctly retained the previous successful artifact.

The audit identifies this as an urgent pipeline-hardening issue:

- valid data can be retrieved successfully;
- provider validation can succeed;
- yet routine publication of a new observation can still block all refreshed datasets and deployment because a test assumes a particular current value.

The incident runbook already distinguishes this condition from provider failure and says a release-sensitive test should be repaired without weakening genuine corruption checks.

## Scope

This story should:

1. Diagnose and fix the known August 19 verification failures.
2. Audit the relevant test suite for the same class of release-sensitive brittleness.
3. Replace inappropriate production-current-value assertions with controlled fixtures, derived expectations, or genuine invariant checks.
4. Add regression coverage proving that normal data advancement does not break the application.
5. Add durable guidance to `AGENTS.md` so future agents do not recreate this testing pattern.
6. Update relevant operational/testing documentation if needed.
7. Rerun the real refresh path and confirm the currently blocked valid data can reach production.

Do not redesign the freshness-monitoring system in this story.

Do not add card-level warning UI, owner alerts, a machine-readable freshness registry, new data providers, or new cron cadence.

## Known incident to repair

Start with the August 19 workflow failure documented in `docs/data-operations.md`.

The audit reports that verification failed after successful retrieval because tests asserted release-sensitive display values involving:

- July housing starts;
- July manufacturing output;
- July capacity utilization on `/secondary`; and
- paired compact-chart values.

Confirm the exact failing tests and root cause from the workflow logs and current repository state rather than assuming the audit summary is exhaustive.

Do not simply replace the old hard-coded values with the newly published values.

That would reproduce the same defect on the next release.

## Required testing principle

Add an explicit repository rule to `AGENTS.md` covering release-sensitive data tests.

The rule should express the following principle clearly:

> Tests must not depend on the current production observation, date, or displayed value unless that exact observation is intentionally the subject of the test.

For UI/component behavior:

- use controlled fixtures;
- make the fixture own the date and value being asserted;
- verify the component correctly renders and interprets the supplied data.

For tests that intentionally exercise committed production datasets:

- prefer structural, transformation, reconciliation, chronology, coverage, validation, and rendering invariants;
- derive expectations from the dataset when appropriate;
- do not encode a currently published value as if it were a permanent invariant.

Preserve legitimate fixed historical fixtures where a known historical observation is intentionally being tested.

The purpose of this rule is not to ban numeric assertions. It is to distinguish:

- **controlled test data**, where exact numeric assertions are appropriate; from
- **live committed production data**, where “latest value equals X” is usually brittle.

## Audit for the broader anti-pattern

Do not limit the work to the currently failing tests.

Search the test suite for assertions that could fail merely because an authoritative dataset advances normally.

Look especially for:

- exact latest observation dates;
- exact current hero values;
- exact newest chart points;
- exact current labels derived from live committed data;
- array lengths that implicitly assume no new observation will be added;
- “latest row” assertions tied to a specific month, week, quarter, or day;
- snapshots or fixtures that unknowingly import mutable production datasets;
- tests that compare rendered output to a current provider value rather than controlled input.

For every candidate, classify it before changing it:

1. **Genuine invariant** — keep it.
2. **Intentional historical fixture** — keep it.
3. **Release-sensitive assertion against mutable production data** — redesign it.
4. **Unclear** — inspect the test’s purpose and choose the smallest correct change.

Do not weaken tests merely because they are failing.

## Preferred remediation patterns

Use the smallest appropriate pattern for each test.

### Controlled component fixtures

If the behavior under test is presentation or interpretation, inject a deterministic dataset.

Example concept:

- fixture latest observation: July 2026;
- fixture value: 1.32;
- assert that the component renders July 2026 and 1.32 correctly.

The test should continue passing when the real provider publishes August data.

### Dataset-derived expectations

Where a test intentionally uses the committed production dataset, calculate the expected latest value or period from that dataset rather than hard-coding today’s result.

Use this only when the purpose is to verify integration with the committed data.

### Domain invariants

Prefer assertions such as:

- observations are chronological;
- required history exists;
- duplicate periods are absent;
- null handling is correct;
- current observation selection returns the final valid observation;
- derived series reconcile with source inputs;
- grouped outputs remain aligned;
- valid provider revisions are preserved;
- malformed data is rejected;
- components render the current dataset without browser/runtime errors.

### Explicit historical regression fixtures

If a specific past value matters because it represents a known edge case, isolate that data as a named historical fixture rather than relying on whatever happens to be current in production.

## Add a data-advancement regression test

Add explicit automated coverage for the scenario that caused this incident:

> A valid dataset receives a newer observation with a different date and value.

The test should exercise an appropriate representative path and verify that advancing the data does not break assumptions.

At minimum, the regression should demonstrate that:

1. a valid existing series can be extended by one later observation;
2. the repository/domain path accepts the advanced series;
3. latest-observation logic selects the newly added period;
4. any applicable derivation or compact-card preparation still succeeds;
5. the UI renders the new latest observation correctly; and
6. the test does not depend on the formerly latest production date/value.

Choose a representative dataset/path that provides meaningful coverage without constructing an artificial repository-wide framework.

If one representative regression test cannot protect the important distinct patterns uncovered by the audit, add the smallest number needed.

Do not create a generalized testing abstraction unless existing duplication clearly warrants it.

## Preserve genuine corruption checks

This story must not make verification more permissive toward bad data.

Retain or improve checks for things such as:

- malformed provider payloads;
- missing required observations;
- invalid dates;
- duplicate periods;
- unexpected truncation;
- broken alignment;
- failed reconciliation;
- invalid derivations;
- schema changes;
- partial atomic groups;
- unsupported null behavior.

If a current failing test mixes a real invariant with a release-sensitive value assertion, separate the two rather than deleting the invariant.

## Operational documentation

Update `docs/data-operations.md` if necessary so the incident runbook points agents toward the new testing principle when a refresh succeeds but verification fails because data advanced.

The documentation should make clear:

- normal data advancement is expected;
- tests must distinguish mutable production data from controlled fixtures;
- a failed current-value assertion is not evidence that the provider data is wrong;
- agents must inspect whether the test encodes a true invariant before changing it.

Avoid duplicating detailed testing guidance across multiple documents. `AGENTS.md` should own the durable development rule; `data-operations.md` should reference the operational implication.

## Do not add a Skill in this story

Do not create a Codex Skill or other parallel instruction system for this issue.

The durable safeguards for this class of failure should be:

- executable tests;
- repository-local testing guidance in `AGENTS.md`; and
- the existing operational runbook.

If implementation reveals a genuinely repetitive multi-step workflow that cannot be expressed cleanly there, mention that in the completion summary rather than adding a Skill speculatively.

## End-to-end proof

After fixing and hardening the tests:

1. Run the affected tests directly.
2. Run `npm run verify`.
3. Run `git diff --check`.
4. Run any applicable smoke tests required by `AGENTS.md`.
5. Run the real data refresh path needed to retrieve the currently available provider data.
6. Inspect the resulting dataset changes.
7. Confirm that valid newly published observations no longer cause verification failure.
8. Commit and push according to the repository story-completion rules.
9. Monitor the exact GitHub Actions run through deployment.
10. Confirm production reflects the refreshed data.

In particular, confirm the previously blocked July housing and manufacturing observations reach production if they remain the latest authoritative observations.

Also inspect the `/dashboard` market tiles after the successful refresh. Under the current delayed end-of-day contract, the S&P 500 tile should advance to the latest FRED close available to that refresh rather than remaining stuck because unrelated verification failed. The audit defines prior-business-day FRED data as healthy for this product and treats multiple completed market days behind as a freshness problem.

Do not alter the S&P 500 product contract or introduce real-time retrieval as part of this story.

## Acceptance criteria

The story is complete when all of the following are true:

- The known August 19 release-sensitive verification failures are correctly repaired.
- No fix merely substitutes the newest hard-coded production value for the previous one.
- Relevant tests have been audited for the same anti-pattern.
- Release-sensitive assertions against mutable production data have been replaced with controlled fixtures, derived expectations, or genuine invariants.
- Legitimate historical and corruption tests remain intact.
- At least one explicit regression test proves that a valid dataset can advance to a newer period/value without breaking verification.
- `AGENTS.md` contains a clear rule against inappropriate current-production-value assertions.
- Operational documentation is updated only as needed.
- No Skill is added unless explicitly approved in a later story.
- `npm run verify` passes.
- Required smoke testing passes.
- `git diff --check` passes.
- The real refresh succeeds.
- The refreshed datasets are committed and deployed successfully.
- Production shows the latest valid observations available under the existing source contracts.
- The final completion summary identifies every release-sensitive test found and how it was made advance-safe.

## Scope guardrails

Do not:

- implement the machine-readable freshness registry;
- add stale-data warning UI;
- add owner notifications;
- change provider cadence;
- add release-calendar automation;
- replace FRED or any other provider;
- implement intraday or real-time S&P data;
- weaken domain validation;
- remove tests merely because they fail when data advances;
- update expected values manually to whatever the provider publishes today.

This story is about making the existing refresh-and-verification process **safe for the next normal data release, and the one after that**.
