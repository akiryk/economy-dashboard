# Story 29 — Implement the corrected Labor briefing rules and 3×2 layout skeleton

## User story

As a reader of the U.S. Economy Dashboard,
I want the Labor briefing to use the approved stock/flow model and appear at its intended at-a-glance scale,
so that it communicates a clear Labor story instead of another research card or a mechanically mixed verdict.

## Source of truth

Implement the revised rules in:

```text
docs/briefing-rules.md
```

Those rules are already approved. Do not reinterpret or redesign them during implementation.

The key approved changes are:

- Labor condition uses unemployment level plus prime-age employment-to-population level.
- Labor direction uses payroll movement plus unemployment-rate movement.
- Payroll level no longer contributes to Labor condition.
- Mixed direction requires opposing material movements.
- Stable-plus-moving resolves to the material movement.
- First-screen copy uses valence-oriented, plain-language historical framing.
- Internal tier/group/reason language remains trace-only.
- The Labor tile is compressed to grid-cell scale.
- `/briefing` renders one real Labor tile in a 3×2 skeleton with five inert placeholders.

## Goal

Update the existing Labor briefing implementation to conform exactly to the revised rules and make the intended multi-tile composition visually reviewable.

Do not implement another analytical dimension.

## Requirements

### 1. Update Labor orchestration

Revise the Labor view-model construction so that:

#### Condition

Uses:

- unemployment-rate level as anchor;
- prime-age employment-to-population level as confirmer.

Do not consume payroll-level percentile or payroll-level condition classification.

#### Direction

Uses:

- payroll-growth movement as anchor;
- unemployment-rate movement as confirmer.

Apply the exact combination table from `docs/briefing-rules.md`.

Initial claims remains supporting evidence only.

### 2. Remove obsolete Labor logic

Remove or stop using any Labor-specific logic that:

- treats unemployment and payroll growth as coequal condition primaries;
- treats payroll level as Labor condition evidence;
- classifies stable-plus-improving as Mixed;
- emits internal group labels in visible synthesis;
- emits raw percentile wording in visible synthesis.

Do not remove generic engine capabilities that remain valid elsewhere unless they are dead code.

### 3. Update synthesis templates

Implement finite templates matching the revised rules.

Visible copy must:

- include unemployment level;
- include valence-oriented historical framing;
- include the latest payroll three-month average;
- explain direction in ordinary language;
- name real conflict only when movements oppose;
- state adverse unemployment movement when direction is Normalizing;
- use readable month labels;
- avoid internal terminology, raw percentiles, ISO dates, causation, and prediction.

Keep revision language brief and conditional.

### 4. Compress the Labor tile

Revise the collapsed Labor tile so that it visibly contains:

1. dimension label;
2. human question;
3. condition and direction;
4. short synthesis;
5. compact visual;
6. freshness;
7. details and research navigation.

Demote from collapsed view:

- long chart-summary paragraph;
- min/latest/max strip;
- detailed band explanation;
- raw comparison dates;
- percentile mechanics;
- revision mechanics.

Keep required facts accessible in disclosures or accessible text.

### 5. Shrink the unemployment visual

Retain unemployment as the anchor visual.

- reduce chart height substantially;
- preserve latest marker;
- preserve median and interquartile band only if legible;
- simplify annotations;
- keep detailed summary accessible;
- add no range selector.

The 10-year window remains provisional.

### 6. Build the 3×2 skeleton

Render `/briefing` as a 3-column × 2-row desktop grid.

Use:

- one real Labor tile;
- five inert gray placeholders.

Each placeholder must:

- visibly say `Layout placeholder`;
- optionally show a future dimension name;
- use gray filler bars or restrained lorem ipsum;
- contain no real values;
- contain no condition/direction labels;
- contain no links or controls;
- load no data;
- invoke no rules.

Hide decorative placeholder content from assistive technology and provide one nearby accessible explanation that only Labor is implemented.

At narrower widths:

- use two columns;
- then one column;
- preserve reading order;
- avoid horizontal overflow.

### 7. Update page introduction

State concisely that:

- Labor is the only implemented analytical tile;
- the remaining cells are layout placeholders;
- the route is being used to evaluate the future at-a-glance composition.

Do not present the page as complete.

### 8. Update the Labor review

Append a dated re-review section to:

```text
docs/labor-briefing-review.md
```

Record:

- corrected current condition;
- corrected current direction;
- final synthesis sentence;
- whether the tile now reads clearly at grid-cell scale;
- whether the compact visual remains useful;
- whether the 2020 spike still argues for a different compact visual;
- final recommendation:
  - Ready to extend;
  - Ready with documented cautions;
  - Not ready to extend.

Do not erase the earlier review history.

### 9. Tests

Add or revise deterministic tests for:

#### Condition

- unemployment + EPOP agreement;
- favorable anchor + typical confirmer;
- direct favorable-versus-unfavorable conflict;
- payroll level cannot change Labor condition;
- missing required condition evidence.

#### Direction

- stable + stable;
- stable + improving;
- stable + deteriorating;
- stable + normalizing;
- improving + deteriorating;
- improving + normalizing;
- deteriorating + normalizing;
- no-fresh suppression.

#### Copy

- no raw percentile wording;
- no `favorable-side` or `unfavorable-side`;
- no reason codes;
- no ISO dates;
- includes unemployment and payroll values;
- Normalizing names adverse unemployment movement;
- revision qualifier is conditional.

#### Layout

- Labor occupies one grid cell;
- exactly five placeholders render;
- placeholders contain no real values, links, or controls;
- placeholders are not exposed as real content;
- page explains that only Labor is implemented;
- 3-, 2-, and 1-column behavior is represented.

#### Real data

Using committed data, verify:

- current Labor condition no longer depends on payroll level;
- current condition comes from unemployment and EPOP;
- current direction comes from payroll and unemployment movement;
- visible synthesis follows the revised rules;
- values reconcile with the research cards;
- placeholders make no repository or network requests.

## Non-goals

Do not implement:

- real Growth;
- real Inflation;
- real Households;
- real Credit;
- real backdrop data;
- cross-dimension tensions;
- supporting-indicator tension lines;
- new datasets;
- payroll diffusion;
- NBER dates;
- overall score;
- default-route promotion;
- generic future-tile infrastructure.

## Acceptance criteria

This story is complete when:

1. Labor condition uses unemployment and prime-age EPOP.
2. Payroll level has no effect on Labor condition.
3. Labor direction uses payroll movement and unemployment movement.
4. Mixed direction requires opposing material movements.
5. Stable-plus-moving resolves to the movement.
6. Normalizing remains explicit about adverse unemployment movement.
7. Visible history is valence-oriented.
8. Internal trace vocabulary is absent from first-screen copy.
9. Labor is compressed to one grid cell.
10. Long chart summary and min/latest/max strip are demoted.
11. Compact unemployment visual remains accessible.
12. `/briefing` renders one real tile plus five inert placeholders.
13. Placeholders contain no fabricated economics and are not interactive.
14. Layout responds at 3, 2, and 1 columns.
15. Labor review records the corrected outcome.
16. No additional dimension is implemented.
17. All required checks pass.
18. The change is committed and pushed as one focused story.

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

1. Compare all current Labor values with research cards.
2. Verify payroll level cannot affect condition.
3. Verify stable-plus-moving fixtures.
4. Inspect desktop, two-column, and one-column layouts.
5. Confirm placeholders load no data and expose no controls.
6. Confirm collapsed Labor contains no audit-style paragraph or min/latest/max strip.
7. Confirm detailed facts remain accessible.
8. Verify keyboard operation.
9. Confirm the default research dashboard is unchanged.
10. Stop temporary processes.
11. Inspect staged diff and status.
12. Exclude screenshots, logs, temporary files, secrets, and unrelated changes.
13. Commit with:

```text
fix: correct labor briefing model and layout
```

14. Push and confirm a clean synchronized working tree.

## Completion report

Report:

- current corrected condition and direction;
- final current synthesis sentence;
- inputs used for each reading;
- compact visual result;
- 3×2 skeleton behavior;
- accessibility treatment;
- Labor review recommendation;
- tests and verification;
- commit hash and message;
- branch and remote;
- push result;
- final working-tree status.

Do not begin another dimension.

End with the repository-required completion marker from `AGENTS.md`.
