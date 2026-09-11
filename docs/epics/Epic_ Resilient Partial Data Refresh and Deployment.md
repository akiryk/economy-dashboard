# Epic: Resilient Partial Data Refresh and Deployment

## Summary

Refactor the economic-data refresh and deployment pipeline so that a failure affecting one independent refresh unit does not prevent unrelated successfully refreshed data from being validated, committed, and deployed.

When an individual source or derivation fails, the application should continue serving that unit's last-known-good data and display a scoped freshness notice wherever the affected dataset is visible. Successfully refreshed independent units should advance normally.

Failures that undermine confidence in the combined application or deployment itself must remain globally blocking.

## Problem

The dashboard is intentionally built around committed, validated datasets and last-known-good behavior. Individual refresh operations already protect existing valid data when retrieval, transformation, validation, or writing fails.

However, the overall automated refresh pipeline remains too coarse-grained.

Today an individual failure within the main economic-data refresh can ultimately cause the refresh command to exit unsuccessfully. The GitHub Actions workflow consequently stops before normal verification, commit, and deployment. Successful independent updates produced during the same run therefore do not reach production.

The result is an undesirable form of coupling:

> One data source fails → unrelated successfully refreshed data remain unpublished.

For a dashboard containing many independent indicators with different providers and publication schedules, this makes the product less current than necessary and makes relatively small provider incidents appear to be whole-dashboard incidents.

The product should instead degrade at the same scope as the actual failure whenever that can be done safely.

## Goal

Allow production to advance with a **mixed validated snapshot** consisting of:

- newly refreshed data from successful independent refresh units; and
- previously committed last-known-good data from failed refresh units.

Every failed unit must be identifiable in operational diagnostics and reflected through the existing dataset-level freshness system.

The combined snapshot must still pass the repository's normal integrity, application, and deployment verification before publication.

## User outcome

A reader should receive the newest trustworthy data the system was able to obtain.

For example, if initial unemployment claims fail to refresh but mortgage rates and all other independent datasets refresh successfully:

- the claims data remain at their last-known-good observations;
- cards or tiles using the affected claims datasets display a scoped update-failure notice;
- mortgage rates and all other successful datasets advance;
- the application is validated and deployed normally;
- no whole-dashboard warning appears merely because claims failed;
- operational diagnostics identify the failed refresh unit and its affected datasets;
- a later successful claims refresh automatically removes the failure state.

The user should never need to understand the pipeline architecture to interpret this state.

## Core principle

**Failure isolation must follow data dependency boundaries.**

The system must not assume that every output file is independently publishable.

A **refresh unit** is the smallest set of retrievals, transformations, validations, and output artifacts that can safely succeed or fail together.

Examples may include:

- one directly retrieved independent series;
- several CPI outputs that derive from shared source data;
- real-wage outputs whose validity depends on both wage and CPI inputs;
- corporate-profit-share data requiring compatible profit and GDP observations;
- housing-detail artifacts that are validated and replaced as a group.

A failed refresh unit preserves all of its last-known-good outputs.

Failure of that unit must not prevent independent units from proceeding.

## Product and architectural requirements

### 1. Refresh units must be explicit

The refresh pipeline must have an explicit representation of its independently publishable units.

For every unit, the system must be able to determine:

- its identifier;
- its inputs or source family;
- the artifacts it owns;
- the visible dataset IDs affected by its failure;
- whether it succeeded, failed, or produced no substantive change;
- a sanitized failure classification and diagnostic reason.

Dependencies between outputs must be represented sufficiently to prevent an invalid partial update.

The implementation should extend existing refresh, freshness-registry, and atomic-write concepts rather than introduce a parallel data ownership model.

### 2. Every independent unit should be attempted

Failure of one refresh unit must not prevent the pipeline from attempting later independent units.

Where appropriate, transient provider failures such as rate limiting or temporary server errors should receive bounded retries.

Retries must remain bounded and deterministic. Persistent failures must not hold the entire refresh indefinitely.

### 3. Failed units preserve last-known-good data

A failed unit must never partially replace its production artifacts.

Existing atomic/grouped-write guarantees must continue to apply.

If retrieval, parsing, derivation, validation, or persistence for a unit fails:

- all outputs belonging to that atomic unit remain at their previously committed state;
- unrelated successful units remain eligible for publication;
- the failure is recorded as structured operational state.

No missing value, placeholder, fabricated value, carry-forward observation, or unofficial substitute may be introduced merely to make a unit appear current.

### 4. Partial publication must still require whole-snapshot verification

Partial refresh does **not** mean partial verification.

After all refresh units have been attempted, the resulting mixed old/new repository state must pass the normal complete validation suite before publication.

This includes applicable:

- dataset/domain validation;
- cross-dataset invariants;
- freshness-registry coverage;
- TypeScript;
- lint;
- automated tests;
- browser smoke tests;
- production build;
- repository/diff checks.

If verification demonstrates that the combined snapshot is internally inconsistent, deployment must stop.

### 5. Successful updates should be committed together

When at least one refresh unit has produced substantive validated changes, those successful changes should be eligible for the normal automated dataset commit even when another independent unit failed.

The commit must contain only allowed generated data/freshness artifacts.

Failed-unit economic data must remain unchanged.

The automated commit represents the complete validated snapshot produced by that run, not a claim that every provider refreshed successfully.

### 6. Dataset-level failure state must reach the product

A refresh-unit failure must map to every materially visible dataset affected by that failure through the existing freshness architecture.

Where an affected dataset appears on multiple surfaces, the state should follow the dataset rather than be implemented separately for each page.

Affected cards or tiles should use the existing scoped freshness treatment, with concise language such as:

**Data update failed**

Additional details may identify that the dashboard is continuing to show the last successfully validated observation.

Healthy cards should receive no failure chrome.

The UI must support more than one simultaneous independent failure.

### 7. Failure state must recover automatically

A subsequent successful refresh of a previously failed unit must clear its pipeline-failure state without manual cleanup.

If the newly retrieved provider data contain no newer observation but the refresh itself succeeds, the previous pipeline-failure state should still clear because the source has again been successfully checked.

A unit that was not attempted, including one skipped because a dependency or
shared prerequisite failed, must not be treated as recovered. A change to
scoped failure or recovery state must be eligible for a status-only deployment
even when no economic-data artifact changed.

Freshness rules may independently determine whether the observation itself is overdue.

### 8. Operational diagnostics must remain explicit

Every automated run should produce enough structured information to determine:

- which refresh units were attempted;
- which succeeded;
- which failed;
- which produced substantive changes;
- which artifacts were preserved;
- which visible datasets are affected;
- why each failure occurred;
- whether deployment proceeded;
- which commit was deployed.

Existing GitHub issue/notification behavior should be extended so partial failures remain operationally visible even though the workflow may successfully deploy.

A successful deployment containing one or more preserved failed units must not be reported operationally as an entirely healthy refresh.

### 9. Global failures remain global

Some failures must continue preventing publication because the system can no longer establish that the resulting application is trustworthy.

Examples include:

- repository-wide verification failure;
- an inconsistency between dependent datasets that cannot safely be isolated;
- malformed refresh-unit/dependency configuration;
- missing required infrastructure or credentials when their absence prevents the pipeline from determining safe unit boundaries;
- inability to create or validate the generated freshness state;
- build failure;
- browser smoke-test failure;
- commit/push failure;
- Pages artifact or deployment failure.

These conditions should retain global incident behavior.

The goal of this epic is **failure isolation, not unconditional deployment**.

## Failure model

The completed system should distinguish at least these classes conceptually:

### Scoped refresh failure

A known refresh unit failed, its previous artifacts remain valid, and the rest of the combined snapshot can be verified.

**Result:** continue, verify, deploy successful independent updates, publish scoped failure state.

### Expected nonblocking source limitation

A source is known to require manual review or has another explicitly supported limitation.

**Result:** preserve current data, expose the appropriate existing freshness/manual-review state, continue unrelated refreshes.

### Verification failure

Refreshes completed, but the resulting combined application does not pass required validation or tests.

**Result:** block commit/deployment and retain global incident behavior.

### Pipeline/deployment infrastructure failure

The system cannot safely commit, push, build, create the artifact, or deploy.

**Result:** block deployment and retain global incident behavior.

## Important semantics

### A failed refresh is not the same as stale data

A refresh attempt may fail even though the existing observation is still current according to its publication contract.

Conversely, a refresh may succeed but discover that an observation has become overdue.

The product should continue distinguishing:

- refresh/pipeline state; and
- observation freshness state.

### “Last successful refresh” metadata

Global refresh metadata must not falsely imply that every dataset successfully refreshed.

If the existing headline date continues to represent the most recent successful **substantive data ingestion**, it may advance when successful units are ingested during a partial-success run.

Dataset-level freshness indicators remain the authority for exceptions.

Any wording or metadata semantics that become misleading under partial success must be explicitly revised and documented.

## Non-goals

This epic does not:

- make every JSON file independently publishable;
- weaken existing dataset validation;
- permit deployment after test/build failures;
- replace official providers after an isolated outage;
- synthesize missing observations;
- redesign the economic cards themselves;
- introduce runtime API fetching in the browser;
- make the dashboard real-time;
- eliminate operational alerts simply because a deployment succeeded;
- redesign provider-specific publication/freshness contracts;
- solve unrelated data-quality or source-licensing issues.

## Acceptance scenarios

The epic is complete only when automated tests demonstrate representative fault scenarios.

### Scenario A — one independent FRED unit fails

Given claims retrieval fails for the relevant refresh unit
and mortgage data have a newer valid observation,

when the scheduled refresh runs,

then:

- claims artifacts remain unchanged;
- mortgage artifacts advance;
- unrelated units continue running;
- the mixed snapshot passes full verification;
- successful changes are committed and deployed;
- the claims dataset receives scoped failure state;
- mortgage data show no failure state;
- no generic whole-dashboard refresh warning is shown solely because claims failed;
- operational diagnostics identify the claims failure.

### Scenario B — two independent units fail

Given two unrelated refresh units fail,

then both preserve their prior data and both receive scoped failure state while unrelated successful units remain publishable.

### Scenario C — grouped derivation fails

Given one input or transformation in an atomic multi-output refresh unit fails,

then none of that unit's dependent artifacts advance.

Unrelated units may still advance.

### Scenario D — failure followed by recovery

Given a unit failed on the previous run,

when a later run checks and successfully validates that unit,

then its pipeline-failure indicator clears automatically whether or not the provider supplied a newer observation.

### Scenario E — mixed snapshot is invalid

Given one or more units refresh successfully,

when complete verification finds that the resulting combined snapshot violates an invariant,

then no new production deployment occurs.

### Scenario F — deployment infrastructure fails

Given all data refresh behavior is valid,

when build, commit/push, artifact generation, or deployment fails,

then the workflow behaves as a global operational failure and does not represent the run as successfully published.

## Executable coverage requirement

The mapping among:

- refresh units;
- generated artifacts;
- freshness dataset IDs; and
- visible product dependencies

must be mechanically checked.

A newly added visible/generated dataset should not be able to bypass failure-state mapping accidentally.

This coverage check should turn the dependency audit required by this epic into a durable repository invariant rather than one-time documentation.

## Implementation strategy

This epic should be delivered through small, independently reviewable stories. The stories should establish architecture incrementally rather than attempt a single pipeline rewrite.

### Story 1 — Refresh-unit model and dependency coverage

Define the refresh-unit abstraction and structured result model.

Inventory current generated artifacts, atomic groups, visible dataset IDs, and dependencies.

Add executable coverage tests proving that all affected visible data can be mapped from refresh outcome to freshness state.

No behavioral change to production deployment is required in this story.

### Story 2 — Complete resilient orchestration

Change orchestration so all independent refresh units are attempted even when one fails.

Preserve existing atomic output behavior.

Add bounded retry behavior where appropriate and structured success/failure/no-change outcomes.

At the end of the story, failures may still block deployment if necessary; the primary goal is complete execution and reliable result reporting.

### Story 3 — Verified partial publication

Allow successful independent dataset changes to proceed through full repository verification despite scoped refresh failures.

If verification succeeds, commit and deploy the mixed old/new snapshot.

Retain global blocking behavior for verification, build, commit, and deployment failures.

This story establishes the core resilience behavior.

### Story 4 — Scoped freshness state and operational reporting

Persist/publish failed refresh-unit state through the existing freshness manifest.

Ensure all affected research cards, status tiles, and comparison modules receive the appropriate scoped notice.

Support multiple simultaneous failures and automatic recovery.

Update GitHub diagnostics/issues so a partial-success deployment remains operationally visible without becoming a global product warning.

### Story 5 — Fault-injection and resilience audit

Add end-to-end controlled failure tests covering:

- one scoped failure;
- multiple scoped failures;
- atomic dependent-output failure;
- successful unrelated advancement;
- recovery;
- verification failure;
- deployment-blocking failure.

Use the claims-versus-mortgage scenario as a canonical regression case.

Audit documentation and remove any obsolete assumptions that a refresh run must be all-success or all-failure.

## Definition of done

This epic is done when:

1. One independent provider/data failure can no longer prevent unrelated valid data from reaching production.
2. Failed atomic units always preserve their last-known-good outputs.
3. Every visible affected dataset receives the correct scoped freshness state.
4. Successful independent units advance normally.
5. The complete mixed snapshot is subjected to the same verification standards as a fully successful refresh.
6. Verification or infrastructure failures still stop deployment globally.
7. Multiple simultaneous failures are supported.
8. Recovery automatically removes resolved failure state.
9. Operational diagnostics make partial failures unmistakable.
10. Refresh-unit/artifact/freshness coverage is enforced automatically.
11. Relevant architecture, data-refresh, data-operations, and product documentation accurately describe the resulting behavior.

## Product success criterion

After this work, a provider problem should degrade **only the portion of the dashboard whose trustworthiness actually depends on that provider problem**.

The dashboard should publish the newest internally consistent and fully verified snapshot available, while making every known exception visible at the narrowest truthful scope.
