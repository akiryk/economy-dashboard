# Story 21: Review and Close Out Phase 1

## Status

Complete.

The product owner reactivated this story after the initial documentation reconciliation. The executable audit, real-provider refresh, browser verification, accepted limitations, review guide, and final evidence are recorded in `docs/phase-1-closeout.md`, `docs/phase-1-limitations.md`, and `docs/dashboard-review-guide.md`. Phase 2 remains intentionally undefined pending selection of a primary product objective.

## User story

As the product owner, I want a rigorous review of the complete Phase 1 dashboard, so that I can verify its coverage, accuracy, clarity, maintainability, and limitations before pausing implementation and deciding what Phase 2 should become.

## Purpose

This is a closeout story. It must not add another economic indicator.

The work is to inspect the completed dashboard as a whole, reconcile the repository with Epic 02, correct stale documentation and clear defects, verify every source and transformation, and produce a practical review guide for the product owner.

Do not treat this as permission for a broad redesign or speculative Phase 2 implementation.

## Governing principle

The dashboard is complete only if its cards answer the questions they appear to ask.

Technical correctness is necessary but insufficient. For every card, verify that:

- the title and question match the actual measure;
- the latest callout has the same meaning as the chart;
- rate, level, index, per-capita, aggregate, real, nominal, annualized, and percentage-point distinctions are clear;
- explanatory copy does not overclaim;
- complementary cards remain distinct;
- mixed evidence is preserved rather than collapsed into a verdict.

## Scope

This story must complete the following work:

1. review Epic 02 line by line;
2. reconcile the story map with Git history and current implementation;
3. confirm every required Phase 1 topic exists or has an explicitly approved substitute;
4. inspect every card’s product meaning and presentation;
5. verify every dataset, transformation, range, zoom behavior, summary, table, and provenance disclosure;
6. run the complete refresh and quality suite;
7. verify every card in a real browser;
8. remove dead code and directly related stale documentation;
9. record accepted limitations;
10. create a dashboard-review guide;
11. identify candidate Phase 2 themes without implementing them;
12. mark Epic 02 complete only after all closeout requirements pass;
13. commit and push the closeout work.

## Explicitly out of scope

Do not add:

- new indicators;
- forecasts or forecast comparisons;
- historical vintages;
- automated divergence detection;
- percentile or median overlays;
- event or recession annotations;
- regional data;
- an overall economic score;
- a major visual redesign;
- broad refactoring unrelated to demonstrated defects;
- Phase 2 code or architecture.

A defect discovered during review may be fixed if it is necessary for Phase 1 correctness and tightly scoped. If the fix would materially alter product scope or architecture, pause and discuss it rather than absorbing it silently into Story 21.

## Phase 1 coverage audit

Confirm that the dashboard provides useful, visible coverage of:

- real economic growth;
- real growth per person;
- productivity level and momentum;
- headline and underlying inflation;
- recent inflation momentum;
- unemployment and prime-age employment;
- payroll growth;
- wages and purchasing power;
- household income and spending;
- saving;
- household financial stress;
- housing affordability;
- housing construction;
- manufacturing output and employment;
- business investment;
- industrial activity;
- interest-rate conditions;
- broad credit conditions;
- federal deficit;
- federal debt held by the public;
- trade balance;
- effective tariff burden.

Use the current repository and approved corrective stories as the source of truth. Do not infer status from stale numbering.

If an Epic 02 requirement was deliberately satisfied by a substitute, document:

- the original requirement;
- the substitute used;
- why it is more defensible or feasible;
- its limitations.

## Card-by-card product review

Create a review checklist covering every visible card.

For each card, verify:

### Question and measure

- The human question is answered by the plotted measure.
- The title does not imply a level when the chart shows growth, or vice versa.
- Relationship cards compare compatible concepts.
- Per-capita and aggregate measures are not mixed misleadingly.
- Real and nominal measures are labeled correctly.
- Provider-published and locally derived values are distinguished.

### Latest callout

- The value and period are current within the committed snapshot.
- Units and transformation are explicit.
- A latest callout is not silently replaced by the endpoint of a historical zoom window.
- Signed values have correct semantic interpretation.

### Chart

- Range presets work.
- Maximum shows full useful available history.
- Story 09A zoom works and resets consistently.
- Zoom does not change economic calculations or selected-range baselines improperly.
- Missing values remain gaps.
- No chart smooths actual observations.
- Axis policies match the measure.
- Zero and reference lines appear only where meaningful.
- Dual axes are absent unless explicitly approved.
- Legends and line styles are unambiguous without color alone.

### Explanation

- Copy explains what the measure includes and excludes.
- Important limitations are visible.
- Growth-rate charts distinguish slowing growth from declining levels.
- Aggregate measures do not claim to describe every household, worker, firm, or region.
- The card avoids unsupported causal claims and unsupported good/bad labels.

### Accessibility

- Heading hierarchy is correct.
- Controls are keyboard accessible.
- Focus is visible.
- `aria-pressed` and labels are accurate.
- Canvas has a useful accessible label.
- The factual summary and semantic table make the chart understandable without canvas.
- Zoom has a usable noncanvas interaction and visible-period description.

### Provenance

- Immediate provider and underlying publisher are accurate.
- Series identifiers are correct.
- Frequency, units, seasonal adjustment, transformation, coverage, and retrieval date are shown.
- Multi-source derivations name every source.
- Local calculations are documented precisely.

## Data and refresh audit

Review every configured source and generated output.

Confirm:

- FRED remains the default intermediary where intended;
- approved non-FRED sources are documented;
- every visible and supporting dataset has a real active use;
- no obsolete source continues refreshing without justification;
- full-history policy is used where required;
- observed coverage matches documentation;
- exact-month or exact-quarter derivations use calendar alignment rather than array position;
- missing values are never converted to zero;
- internal gaps are preserved;
- future-dated values are excluded;
- duplicate dates are rejected;
- grouped derivations use rollback-protected writes;
- direct series use safe atomic replacement;
- one source failure does not corrupt unrelated outputs;
- no credentials or live browser requests are introduced;
- generated JSON is valid, current, and committed.

Run a complete real-provider refresh and compare the reported counts, ranges, and latest periods with documentation.

## Repository and architecture audit

Inspect the implementation for unnecessary divergence from established architecture.

Confirm:

- React components primarily render UI;
- economic calculations are outside JSX;
- repository loading remains explicit and validated;
- ECharts remains lazy-loaded and shared;
- Story 09A zoom has one centralized implementation;
- no card duplicates zoom state, reset controls, event wiring, or visible-range slicing;
- frequency-aware date handling is shared;
- chart variants use focused option builders rather than one unreadable conditional component;
- no unnecessary global state or dependency was added;
- no speculative provider framework or schema-driven dashboard engine has appeared;
- card failures remain isolated;
- no dead components, helpers, fixtures, registrations, or generated files remain.

Search explicitly for duplicated `dataZoom` options, reset markup, unsupported `any`, stale TODOs, debug logs, and unused datasets.

Do not refactor merely for aesthetic preference. Make a change only when it fixes a concrete correctness, maintainability, accessibility, or documentation problem.

## Browser verification

Verify every visible card in a real browser at representative desktop and narrow widths.

For every card:

- load the default range;
- test all preset ranges;
- test zoom and reset;
- inspect at least one tooltip;
- inspect summary and semantic table updates;
- inspect metadata and source links;
- simulate or test the card’s failure state where practical;
- confirm other cards remain usable;
- verify keyboard focus and navigation.

Also verify:

- section ordering and in-page navigation;
- no empty future sections;
- no duplicated cards;
- no stale or contradictory section descriptions;
- no layout collision from long titles, legends, values, zoom controls, or disclosures;
- known data gaps remain visible rather than bridged;
- historical periods such as the 1970s are explorable where source history permits.

Create no permanent screenshots unless the repository already requires visual-regression artifacts. Remove all temporary verification files.

## Documentation reconciliation

Review and update at least:

- `PROJECT_HANDOFF.md`;
- `AGENTS.md` only if a durable workflow rule genuinely changed;
- Epic 02;
- product principles;
- charting architecture;
- economic-series data model;
- data-refresh documentation;
- README or architecture documents directly affected by completed work.

Correct:

- stale story statuses;
- obsolete planned labels;
- inaccurate card and supporting-series counts;
- outdated source lists;
- incorrect coverage dates;
- stale bundle measurements;
- obsolete limitations;
- descriptions of replaced measures;
- unresolved notes that have since been decided.

Do not erase useful historical rationale merely because the implementation evolved. Clearly distinguish current architecture from milestone-specific measurements where both remain useful.

## Accepted limitations register

Create a durable document such as:

```text
docs/phase-1-limitations.md
```

Record each accepted limitation with:

- affected card or subsystem;
- limitation;
- why it is accepted for Phase 1;
- practical consequence for interpretation or maintenance;
- candidate future remedy, if any;
- whether it is a Phase 2 candidate or merely a known constraint.

Include relevant limitations such as:

- aggregate data concealing distributional outcomes;
- differing source start dates;
- manual refresh and no historical-vintage storage;
- revisions to economic data;
- known source gaps;
- canvas limitations despite textual alternatives;
- absence of forecasts and event annotations;
- source-specific licensing or history constraints;
- selected substitutes for unavailable planned measures.

Do not turn limitations into a backlog of implied commitments.

## Dashboard review guide

Create a user-facing document such as:

```text
docs/dashboard-review-guide.md
```

The guide should help the product owner review the completed dashboard rather than explain implementation details.

Include:

1. the purpose of Phase 1;
2. how to interpret levels, growth rates, indexes, percentages, and percentage points;
3. how to use range presets and historical zoom;
4. why a falling positive growth line differs from a negative growth rate;
5. why related indicators may disagree;
6. what Maximum means for different source histories;
7. how to read source details, summaries, and observation tables;
8. suggested cross-card questions to explore;
9. known interpretive cautions;
10. a structured worksheet or set of prompts for recording product feedback.

Suggested review prompts include:

- Which cards answer their questions most clearly?
- Which cards remain hard to interpret without explanation?
- Which relationships are useful enough to deserve future direct comparison?
- Which prominent latest numbers deserve less or more emphasis?
- Which cards feel redundant?
- Which sections feel incomplete despite satisfying the epic?
- Which limitations most reduce usefulness?
- What questions remain unanswered after reviewing Phase 1?

## Candidate Phase 2 themes

Create a short, noncommittal section in the review guide or a separate planning note.

Possible themes may include:

- historical percentile context;
- forecasts versus outcomes;
- data vintages and revisions;
- event and recession annotations;
- normalized payroll growth;
- monthly detail views for quarterly cards;
- relationship exploration;
- regional or distributional views;
- automated refresh;
- focused visual redesign after product review.

Do not rank or commit to these without product-owner review. Do not create implementation stories beyond concise candidate descriptions.

## Epic closeout

After all audits and fixes pass:

- mark every completed story accurately;
- record approved substitutions and corrective stories;
- mark Story 21 complete;
- mark Epic 02 complete;
- update the definition-of-done section with actual verification results or a closeout reference;
- confirm Epic 03 remains provisional and unimplemented.

Do not mark the epic complete if any required Phase 1 topic is absent, any required check fails, the repository is dirty, or documentation remains materially contradictory.

## Tests and verification

Run the complete test and quality suite:

```text
npm run lint
npm run typecheck
npm test
npm run data:refresh
npm run build
git diff --check
```

Also run any established browser, end-to-end, fixture, source-specific, or accessibility checks.

Review:

- every refresh result;
- all warnings;
- bundle output;
- card and dataset counts;
- Git diff and status;
- running processes;
- generated temporary files;
- secrets and environment files.

Fix implementation warnings that indicate real problems. Document accepted external or build-tool warnings precisely rather than silently ignoring them.

## Completion and Git requirements

Before completion:

1. Confirm no new indicator was added.
2. Confirm all Epic 02 requirements are satisfied or explicitly approved as substitutions.
3. Confirm every card passed product-meaning review.
4. Confirm all data and provenance were audited.
5. Confirm every card was verified in a real browser.
6. Confirm documentation and story status are current.
7. Confirm accepted limitations and dashboard-review guide exist.
8. Confirm all checks pass.
9. Create one focused closeout commit.
10. Push without force.
11. Confirm local and upstream branches are synchronized.
12. Confirm the working tree is clean.

The completion report must include every item required by `AGENTS.md`, plus:

- final visible-card count;
- final supporting-series count;
- final generated-dataset count;
- complete section list;
- completed refresh coverage summary;
- defects corrected during closeout;
- approved substitutions;
- accepted limitations;
- review-guide location;
- Phase 2 candidate-note location;
- confirmation that Epic 02 is complete.

End with:

```text
ALL DONE WITH USER STORY 21
EPIC 02 IS COMPLETE
```

## Acceptance criteria

Story 21 is complete when:

- no new indicator was added;
- Epic 02 was reviewed line by line;
- every required Phase 1 topic exists or has a documented approved substitute;
- every visible card passed product-meaning, accessibility, provenance, range, zoom, summary, table, and browser review;
- all datasets and transformations were audited;
- full refresh, lint, type-check, tests, build, and diff checks pass;
- dead code and directly related stale documentation are removed;
- story statuses, counts, coverage, and architecture documentation are accurate;
- an accepted-limitations document exists;
- a dashboard-review guide exists;
- Phase 2 candidates are documented but not implemented;
- Epic 02 is marked complete;
- the focused closeout commit is pushed;
- the branch is synchronized and the working tree is clean.
