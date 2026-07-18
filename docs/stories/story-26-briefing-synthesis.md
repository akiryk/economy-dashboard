# Story 26 — Implement the briefing synthesis rule engine

## User story

As a reader of the U.S. Economy Dashboard,
I want briefing labels to be produced by explicit, deterministic, historically grounded rules,
so that future at-a-glance tiles can summarize economic conditions without hiding disagreement or introducing unsupported editorial judgment.

## Context

Phase 1 provides 28 research cards backed by committed, validated datasets. Epic 4 will add an at-a-glance briefing as a thin synthesis layer over those existing datasets.

The approved product-design proposal defines:

- five cyclical dimensions plus one structural backdrop;
- separate condition and direction readings;
- percentile-based historical condition classification;
- frequency-specific direction calculations with a historical noise gate;
- a Labor-only `normalizing` state;
- explicit `mixed` and `unclear` states;
- freshness and staleness evaluation;
- deterministic dimension-level agreement logic;
- no overall economy score;
- no generated or free-form commentary.

This story implements only the reusable analytical rules. It does not add the `/briefing` route or any visible UI.

## Goal

Create a small, pure, fully tested briefing-domain module that can accept already-loaded observations and configuration and deterministically calculate the analytical states required by the later Labor tile.

Also create `docs/briefing-rules.md` as the authoritative interpretation specification for the briefing layer.

## Requirements

### 1. Add `docs/briefing-rules.md`

Create `docs/briefing-rules.md` from the approved decisions in:

- `docs/epics/04-at-a-glance-briefing.md`, or the repository’s corresponding Epic 4 design document;
- especially its indicator-role inventory, condition and direction framework, conflict rules, freshness rules, and Step 0 decision record.

The document must define, at minimum:

1. The five dimensions and structural backdrop.
2. The prohibition on an overall economy reading.
3. The distinction between condition and direction.
4. The primary 25-year comparison window and shorter-history behavior.
5. The five internal condition tiers.
6. The conservative exact-boundary rule.
7. Indicator valence semantics.
8. Direction windows by frequency:
   - weekly: 13 weeks;
   - monthly: 6 months;
   - quarterly: 2 quarters.

9. The initial 60th-percentile direction noise gate.
10. Direction vocabulary and semantics.
11. Labor-only `normalizing` behavior.
12. `mixed` versus `unclear`.
13. Dimension-level primary agreement rules.
14. Freshness thresholds:

- stale warning after 1.5 times expected cadence;
- no-fresh-evidence state after 2 times expected cadence.

15. The requirement that future synthesis prose come from finite reviewed templates rather than generated commentary.
16. The approved primary, supporting, and deep-dive indicator roles.
17. The known provisional parameters that must be reviewed after the Labor slice.

Include worked examples for every rule implemented in this story. Tests must pin those examples.

Do not duplicate the complete data-source and transformation inventory from `docs/data-refresh.md`.

### 2. Add explicit briefing domain types

Introduce a focused briefing-domain module in the most natural existing domain or utility location.

Use strict TypeScript and explicit domain types. Do not use `any`.

Model concepts explicitly rather than with loosely related booleans. The types should cover at least:

- observation frequency;
- indicator valence;
- valence orientation;
- internal condition tier;
- direction state;
- evidence state;
- freshness state;
- comparison-window metadata;
- indicator-level condition result;
- indicator-level direction result;
- dimension-level reading result.

The model must distinguish at least:

- favorable-side, typical, and unfavorable-side condition groups;
- improving, deteriorating, broadly stable, and normalizing direction;
- mixed evidence;
- unclear or insufficient evidence;
- no fresh evidence.

Names may differ where the repository has a clearer convention, but these distinctions must remain explicit.

Do not create UI display-label or color models in this story. This story produces analytical states, not presentation decisions.

### 3. Implement comparison-window selection

Implement a pure function that selects the observations used for historical comparison.

Rules:

- Use the trailing 25 years ending with the latest valid observation.
- When the committed history is shorter than 25 years, use the complete available history.
- Return metadata sufficient for later traceability, including:
  - requested window;
  - actual comparison start;
  - actual comparison end;
  - observation count;
  - whether the series used short history.

- Do not interpolate missing periods.
- Do not convert missing observations to zero.
- Exclude invalid or non-finite values through explicit validation or a clearly documented input contract.
- Do not read files or call repositories inside the calculation.

The calculation must work with weekly, monthly, and quarterly observations without assuming a fixed number of observations per year.

### 4. Implement percentile calculation

Implement a deterministic percentile-rank calculation for a latest value within its comparison observations.

Requirements:

- Document the exact percentile convention used, including how ties are handled.
- Return a bounded result from 0 through 100.
- Handle repeated values deterministically.
- Handle the minimum supported sample explicitly.
- Return an insufficient-evidence result rather than inventing a percentile when the sample is inadequate.
- Do not introduce a statistical dependency.

The same percentile implementation must be reusable for both level percentiles and historical change percentiles.

### 5. Implement valence orientation and condition tiers

Implement a pure function that converts a raw percentile into a valence-oriented percentile.

Rules:

- For higher-is-better indicators, retain the raw percentile.
- For lower-is-better indicators, reverse it.
- Unvalenced indicators must not receive favorable or unfavorable condition tiers.

Map valence-oriented percentiles to these internal tiers:

- 80–100: very favorable;
- 60–80: favorable;
- 40–60: typical;
- 20–40: unfavorable;
- 0–20: very unfavorable.

Exact boundary values must be assigned to the tier nearer `typical`.

Therefore:

- exactly 20 maps to `unfavorable`;
- exactly 40 maps to `typical`;
- exactly 60 maps to `typical`;
- exactly 80 maps to `favorable`.

Condition classification must not depend on direction.

For unvalenced indicators, support historical position language analytically as high, typical, or low without treating those states as good or bad.

Do not implement dimension-specific visible wording such as `solid`, `elevated`, or `restrictive` in this story unless it is represented as a simple documented mapping kept separate from the analytical tier calculation.

### 6. Implement recent-change calculation

Implement a pure function that calculates the change over the configured direction window:

- weekly series: latest versus 13 weeks earlier;
- monthly series: latest versus 6 months earlier;
- quarterly series: latest versus 2 quarters earlier.

Use actual period identity or dates. Do not assume that array offsets prove period continuity.

If the required comparison period is missing, return insufficient evidence. Do not silently substitute the nearest observation.

The result must retain:

- latest period and value;
- comparison period and value;
- signed change;
- absolute change;
- configured window.

### 7. Implement the historical direction noise gate

For each eligible historical endpoint in the comparison window:

1. Calculate the same-length historical change.
2. Take the absolute magnitude of each valid historical change.
3. Calculate the configured percentile threshold, initially the 60th percentile.
4. Compare the absolute current change with that threshold.

Rules:

- A current movement that does not exceed the threshold is `broadly stable`.
- A movement that exceeds the threshold is material and may be classified by valence.
- A movement exactly equal to the threshold is `broadly stable`.
- Missing historical comparison periods are skipped rather than fabricated.
- If too few historical changes remain to calculate a defensible gate, return insufficient evidence.
- The minimum sample requirement must be explicit and documented.

Return trace information required for later “why this label” disclosure, including:

- current change;
- historical absolute-change percentile threshold;
- historical change count;
- whether the noise gate was passed;
- comparison-window dates.

### 8. Implement indicator direction classification

For a valenced indicator whose movement passes the noise gate:

- movement in the favorable direction → `improving`;
- movement in the adverse direction → `deteriorating`.

For an unvalenced indicator whose movement passes the gate:

- positive movement → `rising`;
- negative movement → `falling`.

Movement that does not pass the gate is `broadly stable`.

The direction result must not alter the condition tier.

### 9. Implement Labor-only normalizing detection

Implement `normalizing` as a configuration-controlled special case, enabled only for the Labor dimension in v1.

A valenced indicator is `normalizing` when all of the following are true:

1. Its movement passes the direction noise gate.
2. The movement is adverse according to its valence.
3. Its current condition remains on the favorable side of the condition scale.

An adverse movement must instead be `deteriorating` once the condition is no longer on the favorable side.

Do not generalize this state to other dimensions.

The result must preserve the underlying adverse movement so later synthesis copy can name it plainly rather than treating `normalizing` as inherently benign.

### 10. Implement freshness evaluation

Implement a pure freshness function based on:

- the latest observation date or period;
- the evaluation date;
- the indicator’s expected release cadence;
- configurable warning and suppression multipliers.

Initial rules:

- at or below 1.5 times expected cadence: current;
- above 1.5 times cadence: stale warning;
- above 2 times cadence: no fresh evidence.

Clarify and test exact-boundary behavior.

The function must return enough information for later UI use:

- evidence age;
- expected cadence;
- threshold dates or durations;
- freshness state;
- whether direction must be suppressed.

When the no-fresh-evidence threshold is crossed, the analytical output must indicate that the direction reading is unavailable. It must not repeat the last calculated direction or translate absent data into `broadly stable`.

Do not implement seven-day `new` markers or page-level refresh UI in this story; those belong to the later freshness-surface story.

### 11. Implement dimension-level agreement logic

Implement pure functions that combine the two primary indicator results for a dimension without averaging or weighting them.

#### Condition

Group valenced internal tiers as:

- favorable side: favorable or very favorable;
- typical;
- unfavorable side: unfavorable or very unfavorable.

Then:

- if both primary indicators are in the same group, return that shared group;
- if they are in different groups, return `mixed`;
- if either required primary has inadequate or stale-suppressed evidence that prevents a defensible reading, return `unclear`.

Do not break ties, average percentiles, select an anchor as winner, or let a supporting indicator change the result.

#### Direction

- If both primary directions agree, return the shared direction.
- If they materially disagree, return `mixed`.
- Treat `normalizing` as analytically distinct; do not silently collapse it into `deteriorating`.
- If either required primary lacks adequate fresh evidence, return `unclear` or `no fresh evidence` according to the documented model.
- Do not average signed changes.

The result must retain the two primary inputs and a deterministic reason code suitable for future template selection and trace display.

### 12. Keep all calculations pure and UI-independent

The rule engine must:

- accept observations and configuration as arguments;
- return typed analytical results;
- perform no network requests;
- perform no file reads;
- perform no React rendering;
- depend on no browser APIs;
- contain no generated prose;
- contain no styling, colors, CSS classes, icons, or ECharts configuration.

Existing repositories may later supply its inputs, but the engine must not own repository access in this story.

### 13. Add deterministic tests

Add focused unit tests for all public rule-engine behavior.

At minimum, cover:

#### Comparison windows

- a series longer than 25 years;
- a series shorter than 25 years;
- irregular weekly dates;
- a gap that must remain a gap;
- insufficient observations.

#### Percentiles

- ascending values;
- descending input order;
- repeated values;
- lowest and highest values;
- exact percentile boundaries;
- insufficient sample.

#### Valence and tiers

- higher-is-better;
- lower-is-better;
- unvalenced;
- exact boundaries at 20, 40, 60, and 80;
- proof that direction does not alter condition.

#### Direction

- material improving movement;
- material deteriorating movement;
- movement below the noise gate;
- movement exactly equal to the noise gate;
- weekly, monthly, and quarterly windows;
- missing exact comparison period;
- inadequate historical changes;
- unvalenced rising and falling states.

#### Normalizing

- adverse movement while condition remains favorable;
- adverse movement after condition crosses to typical;
- favorable movement from a favorable condition;
- attempt to enable normalizing outside Labor.

#### Freshness

- current evidence;
- exact 1.5-times boundary;
- stale warning beyond 1.5 times;
- exact 2-times boundary;
- no fresh evidence beyond 2 times;
- direction suppression when evidence is too old.

#### Dimension combination

- both primaries favorable;
- both typical;
- both unfavorable;
- favorable versus typical;
- favorable versus unfavorable;
- agreeing directions;
- disagreeing directions;
- normalizing versus deteriorating;
- one primary with insufficient evidence;
- one primary with no fresh evidence;
- proof that supporting indicators cannot affect the reading.

Tests must assert behavior and trace values, not implementation details. Avoid broad snapshots.

### 14. Pin the documentation examples

Every worked example included in `docs/briefing-rules.md` must have a corresponding named test or test fixture.

The tests should make it evident which documentation example they protect.

Do not construct tests around the currently latest economic observations. Use small deterministic fixtures so routine data refreshes cannot change the test results.

### 15. Documentation updates

In addition to creating `docs/briefing-rules.md`:

- add it to the appropriate README documentation list;
- add a concise architecture note to the most appropriate existing documentation explaining that briefing interpretation is implemented as pure domain logic over committed research data;
- update the Epic 4 story map or status section to show this story as complete only after implementation and verification.

Do not update `product-overview.md` as though a visible briefing exists. This story adds no user-visible card or route.

## Suggested implementation shape

Use the existing repository organization and naming conventions. A reasonable shape might include:

```text
src/
  features/
    briefing/
      models/
      utils/
```

or an equivalent compact module.

Do not create a large framework merely to match that example. Prefer a few clear files grouped by responsibility.

Potential responsibilities include:

- briefing domain types and configuration;
- comparison-window and percentile calculations;
- condition classification;
- direction and noise-gate calculations;
- freshness evaluation;
- dimension-level combination rules.

The final shape should keep functions focused and business logic outside React while avoiding premature abstraction.

## Non-goals

Do not implement:

- a `/briefing` route;
- a Labor tile;
- any briefing React component;
- sparklines or ECharts options;
- condition or direction chips;
- synthesis sentences or template rendering;
- tension lines;
- the cross-dimension tension catalog;
- the page-level tensions strip;
- supporting-indicator tension detection;
- the structural backdrop panel;
- `new` release markers;
- page-level refresh status;
- NBER recession dates;
- recession shading;
- comparable-episode phrasing;
- research-card anchor links;
- changes to the existing 28 cards;
- promotion of the briefing to the default route;
- new data acquisition;
- a generic scoring, weighting, or composite framework;
- an overall economic verdict;
- new dependencies unless unavoidable and explicitly justified.

## Acceptance criteria

This story is complete when:

1. `docs/briefing-rules.md` exists and accurately records the approved briefing interpretation rules.
2. Pure TypeScript functions implement:
   - comparison-window selection;
   - percentile ranking;
   - valence orientation;
   - internal condition tiers;
   - exact-boundary handling;
   - recent-change calculation;
   - historical direction noise gating;
   - indicator direction classification;
   - Labor-only normalizing;
   - freshness evaluation;
   - dimension-level condition and direction agreement.

3. Mixed and unclear are distinct typed states.
4. Unvalenced indicators cannot receive favorable or unfavorable verdicts.
5. Condition is calculated independently of direction.
6. Stale evidence cannot be described as stable.
7. Dimension primary conflicts cannot be averaged away.
8. All rule outputs include enough typed trace information for later “why this label” disclosure.
9. All worked documentation examples are pinned by deterministic tests.
10. No UI or route has been added.
11. No existing research-card behavior has changed.
12. No unnecessary dependency has been introduced.
13. Relevant documentation is updated without implying that the visible briefing already exists.
14. All repository quality checks pass.
15. The implementation is committed and pushed as one focused story.

## Required verification

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Also:

1. Inspect the full test output and confirm the new rule tests run.
2. Confirm no React component imports the new module yet.
3. Confirm no existing route or visible dashboard output changed.
4. Confirm no generated, temporary, secret, or unrelated files are included.
5. Stop any temporary processes used during verification.
6. Inspect the staged diff before committing.
7. Commit with a focused conventional-style message, for example:

```text
feat: add briefing synthesis rule engine
```

8. Push to the configured GitHub remote.
9. Confirm the branch is synchronized with upstream and the working tree is clean.

## Completion report

Report:

- the domain types and calculations added;
- the percentile and tie conventions chosen;
- the minimum-sample rules chosen and where documented;
- exact freshness-boundary behavior;
- any assumptions or deviations from the approved design;
- documentation updated;
- tests and verification results;
- commit hash and commit message;
- branch name;
- GitHub remote;
- push result;
- final working-tree status;
- any concerns to examine during the Labor vertical-slice review.

End the completion response with the repository-required completion marker from `AGENTS.md`.
