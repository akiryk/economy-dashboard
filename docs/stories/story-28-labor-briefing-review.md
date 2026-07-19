# Story 28 — Review and calibrate the Labor briefing vertical slice

## Purpose

Review the completed Labor briefing tile against the committed real data and the underlying research cards before the briefing framework is extended to any other dimension.

This is the required human-review checkpoint for Epic 4.

The objective is not to make the Labor tile produce a more favorable or intuitive answer. The objective is to determine whether the approved rules, thresholds, vocabulary, templates, trace, freshness treatment, and compact presentation produce an analytically defensible and useful briefing.

## Context

Story 26 implemented the deterministic briefing synthesis rule engine and established `docs/briefing-rules.md` as the source of truth.

Story 27 implemented the first vertical slice:

- a non-default `/briefing` route;
- one complete Labor Market tile;
- unemployment and payroll growth as primary indicators;
- prime-age employment-to-population and initial claims as supporting indicators;
- separate condition and direction readings;
- deterministic synthesis templates;
- an unemployment sparkline;
- freshness and revision disclosures;
- an expandable analytical trace;
- links to the underlying research cards.

The approved Epic 4 sequence requires this Labor slice to be reviewed against real data before work begins on Inflation, Growth, Households, or Credit.

## User story

As the product owner,
I want the Labor briefing tile reviewed against its underlying evidence and historical behavior,
so that the briefing rules are calibrated and trustworthy before the model is repeated across the rest of the economy.

## Scope

This story includes:

1. analytical review of the current Labor result;
2. historical spot checks across representative Labor-market episodes;
3. review of condition and direction classifications;
4. review of the Labor-only `normalizing` state;
5. review of synthesis templates and wording;
6. review of freshness and revision behavior;
7. review of the sparkline and trace;
8. narrowly scoped rule, template, test, or presentation corrections that are justified by the review;
9. documentation of all findings and decisions.

This story does not add another briefing dimension.

## Required review output

Create:

```text
docs/labor-briefing-review.md
```

The review document must record:

- the current committed-data result;
- the evidence used;
- historical episodes checked;
- findings for every review area below;
- decisions to retain, revise, or defer;
- exact rule or copy changes made;
- unresolved concerns;
- the final recommendation on whether the framework is ready to extend.

The document should distinguish:

- defects;
- ambiguous product decisions;
- acceptable limitations;
- deferred enhancements.

## 1. Record the current Labor briefing result

Using the committed datasets, record:

- condition reading;
- direction reading;
- selected synthesis template;
- rendered synthesis sentence;
- latest unemployment value and period;
- latest payroll three-month average and period;
- raw and valence-oriented condition percentiles for both primaries;
- condition tiers and tier groups;
- recent changes for both primaries;
- historical direction noise-gate thresholds;
- whether each movement passed its gate;
- freshness state for both primaries;
- whether the payroll revision qualifier is active;
- supporting evidence from prime-age employment and initial claims.

Confirm that every displayed number agrees with the corresponding research card or the documented briefing transformation.

Any discrepancy is a defect and must be fixed.

## 2. Review the condition classifications

Evaluate whether the 25-year trailing percentile framework produces a defensible Labor condition classification.

Check at minimum:

- unemployment;
- payroll three-month average.

Review questions:

1. Does the raw percentile calculation match the documented convention?
2. Is lower-is-better valence correctly applied to unemployment?
3. Is higher-is-better valence correctly applied to payroll growth?
4. Do exact tier boundaries behave as documented?
5. Does the resulting dimension-level condition follow the primary agreement rule?
6. Is `mixed` used whenever the two primary tier groups differ?
7. Does the visible vocabulary accurately reflect the internal tier?
8. Does the comparison window create a misleading result because of unusual history within the last 25 years?
9. Does the full-history secondary context materially disagree with the 25-year result?
10. If it disagrees, is that divergence visible in the trace or copy as required?

Do not change thresholds merely because the current label feels too positive or negative.

A change requires a general analytical rationale that remains defensible across historical episodes.

## 3. Review direction and the noise gate

Evaluate the six-month recent-change rule and 60th-percentile historical absolute-change gate for:

- unemployment;
- payroll growth.

Confirm:

- exact calendar-period comparison;
- correct handling of missing periods;
- correct signed and absolute changes;
- historical changes use the same-length window;
- exact-threshold movements remain `broadly stable`;
- movements beyond the threshold are classified according to valence;
- stale or missing evidence cannot produce `broadly stable`.

Review whether the provisional 60th-percentile gate:

- suppresses ordinary noise;
- detects clearly meaningful deterioration or improvement;
- triggers too frequently;
- triggers too rarely;
- behaves sensibly for both unemployment and payrolls despite their different units and distributions.

Any proposed change to the gate must be tested across all required historical episodes, not only the current observation.

## 4. Validate Labor-only `normalizing`

Review every case in which the tile or historical fixtures produce `normalizing`.

Confirm that `normalizing` occurs only when:

1. the adverse movement passes the noise gate;
2. the current condition remains favorable;
3. the dimension is Labor;
4. the synthesis sentence plainly names the adverse movement.

Evaluate whether the label clarifies rather than softens deterioration.

The visible sentence must make it possible for a reader to understand that:

- conditions remain favorable relative to history;
- the recent movement is adverse and materially larger than ordinary noise;
- `normalizing` is not a forecast and does not imply the movement will stop.

Check the transition rule:

- favorable-side condition plus material adverse movement → `normalizing`;
- typical or unfavorable condition plus material adverse movement → `deteriorating`.

Document whether the rule should be:

- retained unchanged;
- clarified in wording;
- narrowed;
- removed.

Do not generalize `normalizing` to another dimension in this story.

## 5. Historical episode review

Run the Labor briefing logic against representative historical endpoints using the committed latest-vintage data.

At minimum include episodes representing:

1. a strong and stable labor market;
2. a strong but cooling labor market;
3. early deterioration before a recession or major downturn;
4. a clearly weak labor market;
5. an improving recovery;
6. disagreement between unemployment and payrolls;
7. an extreme shock period;
8. a period affected by unusual data volatility or revisions.

Use exact dates supported by the available datasets.

Candidate periods may include:

- the late 1990s expansion;
- the 2001 downturn;
- the 2007–2009 recession;
- the early recovery after 2009;
- the late 2010s;
- the 2020 shock;
- the 2021–2022 reopening period;
- the current endpoint.

These are review candidates, not required conclusions. Select exact endpoints that best exercise the rules.

For each endpoint, record:

- condition;
- direction;
- primary indicator results;
- selected synthesis template;
- whether the output is analytically credible;
- any problem exposed.

Do not describe the model as having made a real-time forecast. The repository stores latest-vintage data, not contemporaneous vintages.

## 6. Review mixed and unclear states

Confirm that the implementation preserves the distinction:

- `mixed`: adequate evidence points in different directions;
- `unclear`: evidence is inadequate, missing, or unusable;
- `no fresh evidence`: evidence is too old to support a current direction reading.

Review fixtures and real or historical cases for:

- mixed condition;
- mixed direction;
- one missing primary;
- inadequate comparison history;
- missing exact comparison period;
- stale warning;
- no-fresh-evidence suppression.

Confirm that:

- mixed evidence is named explicitly;
- no averaging or tie-breaking hides disagreement;
- supporting indicators cannot change a primary reading;
- absent evidence is never translated into stability.

## 7. Review synthesis templates

Review every Labor template in context, not only in isolated tests.

Confirm that each template:

- names unemployment;
- names payroll growth;
- includes their actual values;
- distinguishes condition from direction;
- explicitly names primary disagreement;
- plainly states adverse movement when direction is `normalizing`;
- includes the payroll revision qualification only when required;
- avoids causal attribution;
- avoids prediction;
- avoids political interpretation;
- avoids excessive statistical jargon;
- remains concise enough for the compact tile.

Identify templates that are:

- misleading;
- repetitive;
- too long;
- too vague;
- overly reassuring;
- overly alarming;
- insufficiently explicit about mixed evidence.

Template revisions are allowed when they preserve deterministic state-to-template selection.

Do not introduce generated prose.

## 8. Review freshness and revision treatment

Validate the freshness behavior against these scenarios:

1. unemployment and payrolls both current;
2. one primary beyond the 1.5-times stale-warning threshold;
3. one primary beyond the 2-times no-fresh-evidence threshold;
4. refresh failure leaving committed data older than expected;
5. one source updating before the other;
6. payroll data revised between committed refreshes.

Confirm exact-boundary behavior matches `docs/briefing-rules.md`.

Review whether the collapsed tile communicates freshness clearly without overwhelming the primary reading.

Confirm the revision language:

- identifies payrolls as commonly revised;
- does not claim a likely revision size or direction;
- does not imply that vintage history is available;
- appears only when the result materially depends on the newest observations.

## 9. Review the sparkline and compact presentation

Inspect `/briefing` at desktop and narrow viewport widths.

Confirm the unemployment sparkline accurately shows:

- the trailing 10-year period;
- the latest observation;
- the 10-year minimum and maximum;
- the 25-year comparison median;
- the interquartile comparison band.

Confirm that:

- the band is not visually presented as a confidence interval;
- median and band calculations match the trace;
- essential values are available without hover;
- the accessible summary is accurate;
- no meaning depends on color alone;
- the condition and direction readings dominate the visual hierarchy;
- the tile remains readable without excessive scrolling;
- disclosures are keyboard operable;
- research links reach the correct cards.

Record any presentation concern that should inform later tiles.

Do not build the complete grid in this story.

## 10. Review supporting evidence

Inspect the treatment of:

- prime-age employment-to-population;
- initial claims four-week average.

Confirm that supporting evidence:

- uses the correct latest values and periods;
- has correct valence;
- has correct frequency-specific direction windows;
- includes appropriate limitations;
- is visibly subordinate to the primaries;
- cannot change the condition or direction chips;
- links to the correct research cards.

Do not implement supporting-indicator tension lines yet.

Record whether either supporting indicator frequently reveals meaningful tension that the later conflict-layer story must handle.

## 11. Allowed implementation changes

Make only changes justified by a documented review finding.

Allowed changes include:

- correcting rule-engine defects;
- correcting data orchestration defects;
- clarifying a documented percentile or boundary convention;
- revising Labor template wording;
- revising Labor display vocabulary;
- changing a provisional Labor direction threshold when historical review demonstrates a general problem;
- correcting freshness behavior;
- improving trace labels;
- improving accessible chart summaries;
- making small Labor-tile layout corrections;
- adding or improving deterministic tests.

Every analytical change must:

1. be recorded in `docs/labor-briefing-review.md`;
2. be reflected in `docs/briefing-rules.md`;
3. include a rationale;
4. include updated tests;
5. be evaluated against all historical review fixtures.

## 12. Prohibited changes

Do not:

- add Inflation, Growth, Households, or Credit tiles;
- build the complete briefing grid;
- add the backdrop panel;
- promote `/briefing` to the default route;
- add an overall score;
- add weights or averages;
- let supporting indicators change primary chips;
- add cross-dimension tension rules;
- add supporting-indicator tension lines;
- add new economic datasets;
- add NBER recession dates;
- add forecasting or causal language;
- use current-label preference as the rationale for threshold changes;
- redesign the research dashboard;
- create speculative abstractions for future dimensions;
- begin Story 29.

## Decision standard

At the end of the review, make one explicit recommendation:

### Ready to extend

Use when:

- the analytical model behaves credibly across current and historical cases;
- remaining concerns are minor or clearly deferred;
- the condition/direction distinction is useful;
- `normalizing`, mixed, stale, and unclear states are understandable;
- templates are accurate and concise;
- the trace makes every reading auditable.

### Ready with documented cautions

Use when:

- the framework is usable;
- identified limitations do not invalidate the next vertical slice;
- the cautions are clearly recorded for future dimensions.

### Not ready to extend

Use when:

- a core rule produces systematically misleading classifications;
- the noise gate cannot distinguish signal from noise adequately;
- the primary agreement model fails;
- the compact presentation obscures rather than clarifies;
- significant redesign is required.

Do not proceed to the Inflation tile unless the final recommendation is `Ready to extend` or `Ready with documented cautions`.

## Testing

Add or update deterministic tests for every implementation change.

Maintain coverage for:

- current result construction;
- condition tiers and boundaries;
- direction noise gates;
- normalizing;
- mixed and unclear;
- freshness suppression;
- payroll revision qualifiers;
- every Labor synthesis template;
- accessibility behavior;
- historical review fixtures.

Historical fixtures must use explicit dates and expected analytical states.

Avoid broad snapshots.

## Documentation updates

Update as needed:

- `docs/labor-briefing-review.md`;
- `docs/briefing-rules.md`;
- the Epic 4 status or story map;
- relevant architecture or routing documentation;
- `product-overview.md` only if visible behavior materially changes.

Do not describe future tiles as implemented.

## Acceptance criteria

This story is complete when:

1. `docs/labor-briefing-review.md` records the full review.
2. The current Labor result has been reconciled with all four research cards.
3. Condition percentiles and tiers have been independently checked.
4. Direction changes and noise gates have been independently checked.
5. The Labor-only `normalizing` state has been evaluated.
6. At least eight representative historical endpoints have been reviewed.
7. Mixed, unclear, stale, and no-fresh-evidence states have been reviewed.
8. Every Labor synthesis template has been reviewed in context.
9. Freshness and payroll revision behavior have been reviewed.
10. Sparkline calculations, accessibility, and layout have been reviewed.
11. Supporting evidence has been reviewed without changing its role.
12. Every implemented correction is documented and tested.
13. No additional briefing dimension has been added.
14. A final readiness recommendation is recorded.
15. All required quality checks pass.
16. The work is committed and pushed as one focused change.

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

1. Open `/briefing` with the current committed data.
2. Compare all displayed Labor values with the research cards.
3. Inspect all historical review fixtures.
4. Inspect normalizing, mixed, stale, unclear, and no-fresh-evidence states.
5. Review desktop and narrow viewport layouts.
6. Verify disclosure controls by keyboard.
7. Confirm no browser data-provider requests occur.
8. Confirm the root route remains the existing research dashboard.
9. Inspect the staged diff.
10. Confirm no temporary files, screenshots, logs, or development processes remain.
11. Commit with a focused conventional-style message, for example:

```text
docs: review labor briefing model
```

Use `fix:` or `feat:` instead when the review produces material implementation changes.

12. Push to the configured GitHub remote.
13. Confirm the branch is synchronized with upstream and the working tree is clean.

## Completion report

Report:

- the current Labor condition and direction;
- the values and periods driving the result;
- historical episodes reviewed;
- findings on the percentile framework;
- findings on the direction noise gate;
- findings on `normalizing`;
- findings on mixed, unclear, and stale states;
- synthesis-template changes;
- freshness or revision changes;
- sparkline and accessibility findings;
- implementation corrections;
- documentation updated;
- final readiness recommendation;
- all verification results;
- commit hash and message;
- branch name;
- GitHub remote;
- push result;
- final working-tree status;
- cautions that must carry into the next dimension.

Do not begin the next dimension.

End the completion response with the repository-required completion marker from `AGENTS.md`.
