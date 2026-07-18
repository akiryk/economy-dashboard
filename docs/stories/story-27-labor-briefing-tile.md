# Story 27 — Build the Labor briefing tile as the first vertical slice

## User story

As a reader of the U.S. Economy Dashboard,
I want a compact Labor Market briefing tile that shows both current conditions and recent direction,
so that I can quickly understand whether people can find and keep work without losing access to the underlying evidence and rules.

## Context

Story 26 adds the briefing synthesis rule engine and establishes `docs/briefing-rules.md` as the source of truth for condition, direction, freshness, and primary-indicator agreement.

This story is the first end-to-end implementation slice for Epic 4. It adds a non-default `/briefing` route containing one complete Labor Market tile.

Labor is the first dimension because its indicators have a clear stock-and-flow structure:

- unemployment describes current labor-market condition;
- payroll growth describes recent direction;
- prime-age employment-to-population provides supporting condition context;
- initial claims provide timely supporting direction context.

The purpose of this story is to test whether the approved briefing model produces a useful, accurate, and explainable result against real committed data before extending the pattern to the other dimensions.

## Goal

Create a `/briefing` route that renders one fully functional Labor Market tile using:

- the existing committed research datasets;
- the repositories already used by the research cards;
- the Story 26 rule engine;
- finite, deterministic synthesis templates;
- an accessible compact sparkline;
- visible freshness and traceability;
- links to the relevant research cards.

Do not implement any other briefing dimension.

## Labor dimension definition

### Human question

Use:

> Can people find and keep work?

### Primary indicators

The two primary indicators determine the dimension-level readings:

1. Unemployment rate
   - role: condition anchor;
   - frequency: monthly;
   - lower is better;
   - current value and historical condition classification contribute to the condition reading;
   - recent six-month movement contributes to direction.

2. Payroll growth
   - role: direction anchor;
   - measure: rolling three-month average of monthly payroll changes;
   - frequency: monthly;
   - higher is better;
   - condition and recent six-month movement contribute according to `docs/briefing-rules.md`;
   - retain the standing revision-prone qualification.

### Supporting indicators

Supporting indicators may qualify the tile and appear in the evidence disclosure, but they may not change either dimension-level chip in this story:

1. Prime-age employment-to-population ratio
   - higher is better;
   - supporting condition evidence.

2. Initial unemployment claims
   - use the official four-week average;
   - lower is better;
   - supporting direction evidence;
   - weekly frequency;
   - retain exact weekly period semantics.

Do not implement the supporting-indicator tension trigger yet. That belongs to the later conflict-layer story.

## Requirements

### 1. Add a non-default `/briefing` route

Add a route at:

```text
/briefing
```

The existing dashboard route must remain the default route.

The new route should:

- use the existing application shell where appropriate;
- render a clear page heading such as `U.S. Economic Briefing`;
- state that this is an initial Labor-only implementation slice;
- contain exactly one economic dimension tile;
- provide a visible link back to the current full research dashboard;
- preserve existing not-found behavior.

Do not move or rename the current dashboard route in this story.

### 2. Load Labor data through existing repositories

Use the existing repository boundary for all four Labor indicators.

Do not:

- import raw JSON directly into the page or component when an existing repository already owns that data;
- duplicate source files;
- perform network requests;
- add a briefing-specific data-refresh path;
- recalculate source transformations already performed for the research cards.

The briefing must consume the same committed observations that drive the existing cards.

Where an existing repository returns more data than the tile needs, perform the briefing-specific interpretation in the briefing domain layer rather than modifying the research repository unnecessarily.

### 3. Produce a typed Labor briefing view model

Create a focused orchestration function or hook that transforms repository results and Story 26 analytical outputs into a typed Labor tile view model.

The view model should contain at least:

- dimension identifier;
- human question;
- condition reading;
- direction reading;
- synthesis-template identifier;
- rendered synthesis sentence;
- latest values and periods used in the sentence;
- anchor sparkline data;
- comparison-band values;
- freshness information;
- revision qualification where applicable;
- primary evidence entries;
- supporting evidence entries;
- trace information;
- research-card link targets;
- loading, error, and insufficient-data states as explicit types.

Keep repository loading, analytical calculation, template selection, and React rendering separate enough to test independently.

Do not introduce generalized multi-dimension infrastructure beyond what the Labor tile actually requires. Small Labor-specific orchestration is preferable to a speculative universal framework.

### 4. Render separate condition and direction readings

The tile must visibly render two independent text readings:

```text
Condition: …
Direction: …
```

Use the display vocabulary defined in `docs/briefing-rules.md`.

The tile must support all Labor-relevant states, including:

#### Condition

- strong;
- solid;
- typical;
- soft;
- weak;
- mixed;
- unclear.

#### Direction

- improving;
- deteriorating;
- broadly stable;
- normalizing;
- mixed;
- no fresh evidence;
- unclear.

Do not communicate meaning through color alone.

Color may be added only as restrained secondary reinforcement using existing design tokens or a small documented extension. Text must remain sufficient without it.

Do not add an overall economy reading.

### 5. Implement finite Labor synthesis templates

Create a finite, reviewed set of deterministic Labor synthesis templates.

Template selection must be based only on typed analytical states and reason codes from the rule engine and Labor orchestration.

At minimum, support distinct templates for:

1. Primaries agree and direction is improving.
2. Primaries agree and direction is broadly stable.
3. Favorable condition with normalizing direction.
4. Favorable condition with deteriorating direction.
5. Unfavorable condition with improving direction.
6. Mixed primary condition.
7. Mixed primary direction.
8. Stale primary evidence.
9. Insufficient or unclear primary evidence.
10. A result materially dependent on the newest payroll estimate.

Each sentence must:

- name unemployment;
- name payroll growth;
- include both latest values;
- include relevant observation periods where needed for clarity;
- describe condition and direction separately;
- name disagreement explicitly when present;
- avoid unsupported causal language;
- avoid forecasts;
- avoid political interpretation;
- avoid generated or free-form commentary.

Use the sanctioned factual structure:

> X while Y.

Do not use causal constructions such as:

- because;
- due to;
- despite the Federal Reserve;
- as a result of;
- therefore the economy will.

### 6. Use actual Labor values in synthesis copy

The sentence must use:

- the latest unemployment rate;
- its relevant historical percentile or comparison phrase;
- the latest rolling three-month payroll average;
- the direction of recent material movement where applicable.

Use concise formatting appropriate to each measure:

- unemployment as a percentage with sensible precision;
- payroll growth in thousands with a sign when useful;
- percentiles as whole numbers unless the existing product convention calls for more precision.

Do not expose excessive calculation precision.

Do not hard-code the current values into components or templates.

### 7. Add the unemployment anchor sparkline

Use unemployment as the Labor tile’s anchor metric.

Render a compact historical sparkline with:

- a fixed trailing 10-year display window ending at the latest observation;
- the unemployment series;
- a median reference line calculated over the applicable 25-year comparison window;
- an interquartile historical band calculated over that comparison window;
- the latest observation visibly marked;
- labeled minimum, maximum, and latest values;
- a factual nonvisual summary;
- no user-selectable range control in the tile.

The interquartile band and median represent the distribution of unemployment values in the comparison window. They are not a confidence interval.

The chart must not imply that lower values are universally consequence-free; analytical interpretation remains in the rules and copy.

Use the existing charting architecture where practical. Do not force the research-card chart component into this tile if doing so produces a complicated or inappropriate API. A small dedicated sparkline component is acceptable.

Do not introduce a new charting library.

### 8. Make the sparkline accessible

The sparkline must supplement, not replace, accessible information.

Provide:

- a concise visible or screen-reader-accessible factual summary;
- latest value and period;
- 10-year minimum and maximum;
- comparison-window median;
- clear identification of the historical band;
- no reliance on hover interaction for essential information.

If rendered with canvas, ensure equivalent text is available outside the canvas.

The tile and all controls must be keyboard accessible.

### 9. Add the synthesis trace disclosure

Add a native disclosure labeled:

```text
Why this label
```

When expanded, show the information needed to audit the tile.

At minimum include:

#### Condition trace

- each primary indicator;
- latest value and period;
- raw percentile;
- valence-oriented percentile;
- comparison-window start and end;
- internal condition tier;
- favorable, typical, or unfavorable grouping;
- whether short-history behavior applied.

#### Direction trace

- recent comparison window;
- signed current change;
- absolute current change;
- historical noise-gate threshold;
- whether the movement passed the gate;
- resulting indicator direction;
- whether Labor normalizing logic applied.

#### Dimension trace

- each primary’s condition group;
- each primary’s direction state;
- agreement or disagreement reason;
- final dimension condition;
- final dimension direction.

#### Freshness trace

- latest period for each primary;
- expected cadence;
- evidence age;
- freshness state;
- whether direction was suppressed.

Use readable labels and formatted values. Do not expose raw JSON.

### 10. Add supporting-evidence disclosure

Add a separate native disclosure labeled:

```text
Supporting evidence
```

Show:

- prime-age employment-to-population ratio;
- initial claims four-week average.

For each, include:

- latest value;
- latest observation period;
- historical comparison phrase or analytical state;
- recent direction state where available;
- a concise limitation or role statement;
- link to the corresponding research card.

Clearly state that supporting indicators do not determine the Labor tile’s condition or direction readings.

Do not add a tension line in this story.

### 11. Show freshness visibly

The collapsed tile must show a concise freshness line based on the oldest primary input.

Example structure:

```text
Based on unemployment through June 2026 and payrolls through June 2026.
```

Where a primary is stale beyond the configured warning threshold:

- show a visible stale marker;
- retain the condition reading with an appropriate age qualifier;
- follow the rule engine’s direction behavior.

Where a primary crosses the no-fresh-evidence threshold:

- display `Direction: no fresh evidence`;
- do not repeat a previously calculated direction;
- make the reason visible in the synthesis sentence and trace.

Do not implement:

- the global page freshness range;
- the last successful refresh date;
- the seven-day `new` marker;
- whole-dashboard stale handling.

Those belong to the later freshness-surface story.

### 12. Preserve payroll revision disclosure

Payroll growth is revision-prone.

When the tile’s interpretation depends materially on the latest one or two payroll observations:

- include a concise clause in the synthesis sentence indicating that the newest payroll estimate is commonly revised;
- include a standing revision badge or note in the trace.

Do not claim:

- the size of likely revisions;
- the direction of future revisions;
- that a payroll value is preliminary unless the underlying metadata supports that exact term;
- vintage comparisons that the repository does not store.

### 13. Add research-layer navigation

The tile must link to the relevant existing research cards.

At minimum provide links for:

- unemployment;
- payroll growth;
- prime-age employment-to-population;
- initial claims.

Use stable route anchors or identifiers.

If the current research page does not yet expose stable card anchors, add the smallest necessary anchor support without changing card content or layout.

Do not build general briefing-to-research navigation for every dimension.

### 14. Add route navigation from the existing dashboard

Add a restrained navigation link from the current dashboard to `/briefing`.

The link should make clear that the briefing is currently a Labor-only preview or initial slice.

Do not give the preview more prominence than the existing research dashboard.

Do not make `/briefing` the default route.

### 15. Handle loading, error, and unclear states

The route and tile must handle:

- repository loading;
- repository failure;
- one missing primary dataset;
- one missing supporting dataset;
- inadequate comparison history;
- missing exact direction comparison periods;
- stale evidence;
- fully valid data.

Requirements:

- missing supporting evidence must not prevent the primary Labor reading from rendering;
- missing or unusable primary evidence must produce an explicit unclear state;
- errors must be visible and useful;
- no exception should be silently swallowed;
- no fabricated fallback values may be shown.

### 16. Keep visual design restrained

The tile should follow the existing information-first visual language.

Visual hierarchy:

1. human question;
2. condition and direction readings;
3. synthesis sentence;
4. sparkline;
5. freshness;
6. evidence links and disclosures.

Avoid:

- oversized dashboard-score styling;
- traffic-light presentation;
- decorative icons carrying analytical meaning;
- dense strips of current, prior, median, and five-year values;
- card-within-card nesting;
- excessive borders or badges;
- mobile layouts that require horizontal scrolling.

Desktop may render the tile at a width representative of the future briefing grid, but do not build the complete 3×2 layout yet.

### 17. Responsive behavior

On narrow screens:

- stack tile content vertically;
- keep condition and direction legible;
- preserve the sparkline band and median;
- keep disclosures usable by touch and keyboard;
- prevent analytical text from being truncated;
- avoid fixed widths that overflow.

Do not implement the future stacked five-dimension page.

### 18. Testing

Add deterministic tests at the appropriate levels.

#### Labor orchestration tests

Cover at minimum:

- favorable condition and broadly stable direction;
- favorable condition and normalizing direction;
- favorable condition and deteriorating direction;
- unfavorable condition and improving direction;
- mixed primary condition;
- mixed primary direction;
- stale primary;
- no fresh evidence;
- insufficient primary data;
- missing supporting data;
- payroll revision qualifier selection;
- correct research-card links;
- proof that supporting indicators do not change either chip.

Use deterministic fixture observations rather than current committed values for these unit tests.

#### Template tests

For every Labor template:

- verify the correct template is selected;
- verify unemployment and payroll values are included;
- verify mixed states name both sides;
- verify stale states do not imply stability;
- verify normalizing copy names the adverse movement;
- verify causal or predictive phrasing is absent;
- verify revision language appears only when required.

Avoid broad snapshots.

#### Component tests

Verify:

- the human question renders;
- separate condition and direction labels render;
- synthesis sentence renders;
- freshness line renders;
- `Why this label` disclosure is keyboard operable;
- `Supporting evidence` disclosure is keyboard operable;
- research links exist;
- loading state renders;
- primary-error state renders;
- supporting-data failure does not suppress valid primary results;
- accessible sparkline summary is present.

#### Route tests

Verify:

- `/briefing` renders the Labor preview;
- the existing default route remains unchanged;
- navigation works in both directions;
- invalid routes retain current behavior.

#### Real-data integration test

Add at least one integration-level test using the committed Labor repositories to confirm:

- all four Labor datasets load;
- the Labor view model is produced without error;
- condition and direction are recognized typed states;
- sentence placeholders are fully resolved;
- the sparkline contains valid observations;
- trace metadata is populated.

Do not assert that the latest real-data label must always equal a specific favorable or unfavorable state unless the test intentionally pins committed data and the maintenance cost is justified.

### 19. Manual review fixture or development aid

Provide a simple development-only way to inspect the Labor tile under several analytical states without changing committed production data.

Acceptable options include:

- a test-only render harness;
- Storybook only if Storybook already exists;
- a development query parameter guarded from production behavior;
- focused component test fixtures;
- a small internal fixture module used only by tests and local review.

Do not add a new dependency or broad preview framework solely for this purpose.

At minimum, reviewers must be able to inspect:

- normal;
- normalizing;
- mixed;
- stale;
- unclear.

Do not expose fixture controls in the production UI.

### 20. Documentation updates

Update:

- the Epic 4 story map or status record;
- README navigation if necessary to mention the non-default briefing preview;
- relevant routing or architecture documentation;
- `docs/briefing-rules.md` only where implementation reveals a necessary clarification.

Do not revise approved thresholds merely to make current Labor data produce a more appealing label.

If the real-data result appears questionable, document the concern for the human review checkpoint rather than silently changing the rule.

Do not update `product-overview.md` to describe all five briefing dimensions as implemented. A concise note that a Labor-only preview exists is acceptable if that document is the established visible-product inventory.

## Suggested implementation shape

Follow the existing repository structure and Story 26 conventions.

A reasonable shape might include:

```text
src/
  features/
    briefing/
      components/
        LaborBriefingTile.tsx
        BriefingSparkline.tsx
      models/
        laborBriefing.ts
      templates/
        laborSynthesisTemplates.ts
      utils/
        buildLaborBriefing.ts
  pages/
    BriefingPage.tsx
```

This is illustrative, not mandatory.

Do not create generic components such as `UniversalDimensionTile`, `UniversalEvidenceEngine`, or `BriefingSchemaRenderer` unless the Labor implementation cannot reasonably be built without them.

One dimension is not enough evidence for a broad abstraction.

## Non-goals

Do not implement:

- Growth briefing tile;
- Inflation briefing tile;
- Household briefing tile;
- Credit briefing tile;
- structural backdrop panel;
- full briefing grid;
- default-route promotion;
- economy-wide score or verdict;
- cross-dimension tensions strip;
- supporting-indicator tension lines;
- generic tension-rule engine;
- seven-day `new` markers;
- global refresh header;
- page-level stale handling;
- NBER recession data;
- recession shading;
- comparable historical episodes;
- inflation deflation display UI;
- dimension-specific components for future tiles;
- free-form or AI-generated copy;
- forecasts;
- causal claims;
- new economic datasets;
- changes to research-card calculations;
- dependency upgrades unrelated to this story.

## Acceptance criteria

This story is complete when:

1. `/briefing` exists and is not the default route.
2. The route contains exactly one complete Labor Market tile.
3. The existing dashboard remains available and unchanged as the default research experience.
4. The tile uses the existing repositories and committed data.
5. The tile uses Story 26’s rule engine rather than duplicating its analytical logic.
6. Unemployment and payroll growth determine the Labor condition and direction readings.
7. Prime-age employment and initial claims appear only as supporting evidence.
8. Separate condition and direction readings are visibly rendered.
9. Labor-only normalizing behavior is supported.
10. Synthesis prose comes from finite deterministic templates.
11. Every synthesis sentence names unemployment and payroll growth with actual values.
12. Mixed evidence is named rather than averaged.
13. Stale evidence is not described as stable.
14. Payroll revision exposure is disclosed without unsupported revision claims.
15. The unemployment sparkline shows:
    - a fixed 10-year window;
    - comparison-window median;
    - interquartile band;
    - latest marker;
    - minimum, maximum, and latest labels;
    - an accessible factual summary.

16. `Why this label` exposes condition, direction, agreement, and freshness trace information.
17. `Supporting evidence` exposes prime-age employment and initial claims.
18. All four Labor research cards are reachable through stable links.
19. Loading, error, insufficient-data, and stale states are handled explicitly.
20. The tile is keyboard accessible and does not rely on color alone.
21. The layout works on desktop and narrow screens.
22. No other dimension or conflict layer is implemented.
23. Documentation accurately describes the Labor-only preview.
24. All required checks pass.
25. The story is committed and pushed as one focused change.

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

1. Run any relevant real-data repository or refresh validation that does not require changing committed data.
2. Open `/briefing` at desktop and narrow viewport widths.
3. Confirm:
   - the current real-data values match the corresponding research cards;
   - the chips match the rule trace;
   - the sentence contains no unresolved placeholders;
   - the sparkline represents the unemployment observations accurately;
   - the median and interquartile band match the trace calculations;
   - research links reach the intended cards;
   - disclosures work by keyboard;
   - loading and error states are usable;
   - no color is required to understand the readings.

4. Inspect at least the normalizing, mixed, stale, and unclear fixtures.
5. Confirm the root route still renders the existing dashboard.
6. Confirm no network request is made by the browser for economic data.
7. Confirm no temporary fixtures, screenshots, logs, or development processes remain.
8. Inspect the staged diff and repository status.
9. Commit with a focused conventional-style message, for example:

```text
feat: add labor briefing preview
```

10. Push to the configured GitHub remote.
11. Confirm the branch is synchronized with upstream and the working tree is clean.

## Completion report

Report:

- the route and Labor tile implemented;
- the actual current-data condition and direction readings;
- the synthesis template selected for current data;
- the current unemployment and payroll values shown;
- the comparison window and noise-gate results;
- the freshness status of both primaries;
- the sparkline and accessibility implementation;
- the trace and supporting-evidence disclosures;
- any stable research anchors added;
- fixture states reviewed;
- assumptions or deviations;
- documentation updated;
- all test and verification results;
- commit hash and message;
- branch name;
- GitHub remote;
- push result;
- final working-tree status;
- analytical or presentation concerns to evaluate at the required human review checkpoint.

Do not begin another briefing dimension. Story 27 ends at the Labor review checkpoint.

End the completion response with the repository-required completion marker from `AGENTS.md`.
