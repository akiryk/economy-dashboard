# Story 09A: Add Shared Interactive Historical Zoom to All Time-Series Charts

## Status

Complete.

## User story

As a dashboard reader, I want to zoom into any historical period on any chart and reset easily, so that I can investigate episodes such as 1970–1977 without losing long-run context.

## Product goal

Add interactive historical zoom to every current dashboard time-series chart through one shared implementation.

The existing range presets remain:

```text
5y | 10y | 20y | Max
```

Zoom refines the selected preset. It does not replace it.

Example:

1. Select **Max**.
2. Narrow the visible window to approximately 1970–1977.
3. Inspect that period in the chart, summary, and semantic table.
4. Select **Reset zoom** to return to the full Max range.

## Critical architectural requirement

Implement zoom once at the shared chart/presentation boundary.

Do not create separate zoom components, state models, reset controls, ECharts event handlers, or duplicated helper files for individual cards.

The implementation should have one obvious maintenance path for:

- zoom state;
- ECharts `dataZoom` configuration;
- visible-period calculation;
- reset behavior;
- preset-change behavior;
- summary filtering;
- semantic-table filtering;
- accessible visible-period text;
- shared zoom controls;
- tests of common zoom behavior.

A later change such as removing inside zoom, changing the slider height, altering reset behavior, or revising visible-range semantics should normally require changing one shared implementation rather than editing every card.

### Expected ownership

Prefer a structure equivalent in responsibility to:

```text
shared chart component or hook
  owns zoom state and ECharts events

shared zoom controls
  owns visible period and Reset zoom UI

shared visible-range utilities
  derive visible observations from dates or indexes

existing chart option builders
  receive shared dataZoom configuration
```

Use the repository’s current names and architecture rather than introducing these exact filenames mechanically.

### Allowed card-specific configuration

A card may supply only the information genuinely needed by the shared implementation, such as:

- frequency;
- date formatter;
- aligned observations;
- whether the chart is eligible for zoom;
- existing summary/table adapters;
- a short note for selected-range-normalized charts.

Do not allow cards to supply their own arbitrary zoom behavior.

### Duplication gate

Before completion, inspect the implementation for repeated zoom logic.

The story is not complete if multiple cards contain substantially similar:

- `dataZoom` option objects;
- reset-button markup;
- visible-range state;
- date-window calculations;
- zoom event subscriptions;
- summary/table slicing logic.

Extract shared behavior before committing.

## Scope

Apply the shared zoom behavior to all compatible current time-series charts, including:

- single-series growth charts;
- single-series level charts;
- payroll and signed-count charts;
- two-series relationship charts;
- selected-range normalized charts;
- monthly and quarterly charts.

Future compatible cards that use the shared chart boundary should receive zoom without new card-specific implementation.

Do not add zoom card by card.

Do not add:

- URL persistence;
- synchronized zoom across cards;
- a global dashboard date selector;
- saved views;
- event annotations;
- arbitrary date-entry fields;
- chart export;
- cross-period comparison;
- changes to economic calculations or generated datasets.

## Interaction model

### Preset range

The existing preset determines the complete dataset supplied to the chart.

### Visible range

The zoom window determines which portion of the selected preset is visible.

Maintain these as separate concepts:

- **Selected preset:** 5y, 10y, 20y, or Max.
- **Visible period:** the zoomed subset currently shown.

### Changing presets

Selecting a new preset must:

- clear the existing zoom;
- show the complete new preset;
- update summary and table content;
- remove the active Reset zoom state.

A zoom window must never carry over proportionally to another preset.

### Reset zoom

Show a native **Reset zoom** button only when the visible period is narrower than the selected preset.

Reset zoom must:

- restore the full selected preset;
- update the chart, summary, and table;
- leave the selected preset unchanged;
- preserve predictable keyboard focus.

## ECharts interaction

Use ECharts’ official `dataZoom` component.

### Visible slider

Provide one compact horizontal slider beneath the plotting area for every compatible chart.

The slider must:

- have two handles;
- allow resizing the visible window;
- allow moving the selected window earlier or later;
- support monthly and quarterly data;
- remain visually secondary to the chart.

### Inside interaction

Inside panning or zooming may be enabled only through the same shared configuration.

Do not enable ordinary mouse-wheel zoom if it interferes with page scrolling.

If inside behavior is added, it must be removable or alterable in one shared location.

## Date and observation semantics

After zooming, derive the first and last actually visible observations.

Show human-readable text such as:

```text
Visible period: January 1970–December 1977
```

or:

```text
Visible period: 1970 Q1–1977 Q4
```

Do not expose ECharts percentage positions to the user.

Prefer date- or observation-index-based application state over storing only slider percentages when that produces more deterministic behavior.

## Economic-calculation integrity

Zoom changes only visibility and range-dependent summaries.

It must not recalculate economic measures from the visible subset.

Examples:

- year-over-year growth retains its prior-year source observation even when that observation is outside the visible window;
- three-month annualized inflation retains its original calculation;
- payroll averages remain refresh-time derivations;
- committed values remain unchanged.

## Selected-range-normalized charts

For charts normalized to 100 at the start of the selected preset:

- zooming must not rebase the series;
- the baseline remains the start of the selected preset;
- zoom changes only the visible period;
- Reset zoom restores the full preset.

Where needed, show shared explanatory text such as:

```text
Indexed to the start of the selected 20-year range
```

Do not create card-specific zoom rebasing rules.

## Summary behavior

The accessible factual summary must describe the visible zoom period.

When zoomed, it should use only visible observations for:

- visible start and end;
- first and last visible values;
- visible minimum and maximum;
- visible relationship facts.

It may say:

```text
Showing 1970 Q1–1977 Q4 within Maximum
```

The prominent latest card value should generally continue to represent the latest available observation, not the final observation in the zoomed historical window.

Keep that distinction explicit:

- card callout: latest economic observation;
- chart summary: currently visible historical period.

## Semantic table behavior

The semantic table must follow the visible period.

When zoomed into an earlier period:

- show observations from that period;
- preserve the existing row-count convention;
- use the latest rows within the visible window;
- retain aligned relationship values;
- avoid recalculating economic measures inside JSX.

Reset zoom restores the table to the full selected-preset behavior.

Implement this through shared visible-range utilities or adapters rather than separate card-specific slicing.

## Accessibility

Canvas interaction is not sufficient.

The shared implementation must provide:

- a native Reset zoom button;
- visible period text;
- unchanged keyboard-accessible preset controls;
- summary and table updates;
- visible focus styling;
- no keyboard trap.

Verify whether the ECharts slider itself is keyboard operable.

If it is not sufficiently accessible, add one shared companion control pattern for all charts. Do not create custom accessibility controls per card.

A restrained shared pattern such as these controls is acceptable:

```text
Move earlier
Move later
Zoom in
Zoom out
Reset zoom
```

Do not introduce a full date-entry form unless simpler shared controls prove inadequate.

## Shared state and lifecycle

Each card has independent zoom state, but every card must use the same shared implementation.

Zoom state should be local to the shared card/chart wrapper, hook, or controller—not global application state.

The implementation must avoid:

- ECharts-to-React update loops;
- stale event subscriptions;
- zoom reset during ordinary tooltip updates;
- one card affecting another card;
- duplicated event wiring.

Register and unregister ECharts zoom events through one shared lifecycle path.

## ECharts architecture

Register `DataZoomComponent` once through the existing modular ECharts imports.

Extend the existing chart architecture so shared option construction receives the zoom configuration.

Preserve:

- one ECharts instance per chart;
- lazy loading;
- shared ECharts bundle;
- resizing behavior;
- failure handling;
- missing-value gaps;
- unsmoothed observations;
- existing axis and tooltip rules.

Do not create another chart wrapper or another ECharts bundle for zoom.

## Visual design

The shared slider and controls should be compact and restrained.

They must not:

- dominate the card;
- obscure axis labels;
- use alarm colors;
- substantially increase card height;
- appear differently without reason across cards.

Spacing, labeling, and Reset zoom placement should be controlled centrally.

## Performance

Maximum may contain decades of monthly data.

Keep every source observation available.

Do not add aggregation or downsampling without measured evidence and explicit approval.

Throttle or debounce summary/table updates only if required by measured interaction performance. If used, implement that behavior once in the shared zoom layer.

## Tests

Add deterministic shared tests covering at least:

1. Every compatible chart receives the shared `dataZoom` configuration.
2. `DataZoomComponent` is registered only once.
3. No second ECharts bundle or chart wrapper is introduced.
4. The full selected preset is visible initially.
5. Zooming derives the correct first and last visible observations.
6. Reset zoom restores the full preset.
7. Changing presets clears zoom.
8. Zoom state in one card does not affect another.
9. Monthly periods format correctly.
10. Quarterly periods format correctly.
11. Summary observations follow the visible period.
12. Table observations follow the visible period.
13. The prominent latest callout remains tied to the latest economic observation.
14. Missing observations remain gaps.
15. Derived economic values are not recalculated from the visible subset.
16. Selected-range-normalized charts do not rebase when zoomed.
17. ECharts events do not create a React update loop.
18. Event handlers are removed on unmount.
19. Reset zoom is keyboard accessible.
20. Existing preset controls retain `aria-pressed`.
21. A chart-rendering failure leaves summary and table content usable.
22. Existing cards retain their prior economic meaning.
23. New compatible charts inherit zoom through the shared path.
24. No card contains a duplicate `dataZoom` configuration.
25. No card contains its own duplicated Reset zoom UI.
26. No card implements its own visible-date slicing.

Use targeted unit tests for shared utilities and integration tests for representative chart variants. Do not duplicate the same interaction test across every individual card when one shared test plus representative integrations establishes the behavior.

## Browser verification

Verify representative examples of every chart variant in a real browser:

- monthly single-series;
- quarterly single-series;
- signed-count chart;
- two-series relationship chart;
- selected-range-normalized chart.

Confirm that:

- all current time-series cards expose the same zoom interaction;
- Max can be narrowed to a historical period such as 1970–1977 where coverage permits;
- the slider can be resized and moved;
- Reset zoom is obvious and reliable;
- preset changes clear zoom;
- summaries and tables follow the visible period;
- latest callouts do not incorrectly become historical callouts;
- normalized charts do not rebase;
- page scrolling is not disrupted;
- narrow layouts remain readable;
- keyboard interaction is usable;
- no card has visibly inconsistent zoom controls;
- zooming one chart does not change another.

Also inspect the code after implementation and confirm there is one shared maintenance path for the feature.

## Documentation

Update `charting.md` and other directly relevant documentation to describe:

- preset range versus visible zoom range;
- the shared zoom architecture;
- centralized state and controls;
- summary and table behavior;
- normalized-chart baseline behavior;
- accessibility behavior;
- ECharts module and bundle impact;
- current limitations.

Add Story 09A to Epic 02 without renumbering later stories.

Mark it complete only after implementation, verification, commit, and push.

## Required verification

Run the complete repository verification required by `AGENTS.md`, including:

```text
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Run `npm run data:refresh` if the repository’s completion workflow requires it, even though this story should not change economic datasets.

Also:

- inspect the production bundle for one shared ECharts chunk;
- inspect the final diff for duplicated zoom logic;
- search the codebase for repeated `dataZoom` option definitions;
- search for repeated Reset zoom markup;
- verify representative cards in a real browser;
- stop temporary processes;
- confirm no screenshots, logs, or unrelated files are committed.

## Completion and Git requirements

Before completion:

1. Confirm zoom applies to all compatible current time-series charts.
2. Confirm future compatible charts inherit it through the shared boundary.
3. Confirm there is one centralized implementation.
4. Confirm no per-card duplicate zoom components or logic remain.
5. Confirm summaries and tables follow the visible range.
6. Confirm economic calculations are unchanged.
7. Confirm all required checks pass.
8. Create one focused conventional-style commit.
9. Push without force.
10. Confirm the branch is synchronized and the working tree is clean.

The completion report must include:

- the shared architecture used;
- the files that centrally own zoom behavior;
- confirmation that no card-specific duplicate implementation was added;
- supported chart variants;
- accessibility behavior;
- verification results;
- bundle impact;
- commit hash and message;
- branch and remote;
- push result;
- final working-tree status;
- known limitations.

End with:

```text
ALL DONE WITH USER STORY 09A
```

## Acceptance criteria

Story 09A is complete when:

- every compatible current time-series chart supports historical zoom;
- one shared implementation controls zoom behavior;
- no chart has its own duplicate zoom component or event logic;
- the existing presets remain;
- zoom refines the selected preset;
- Reset zoom restores the preset;
- preset changes clear zoom;
- summaries and tables follow the visible period;
- latest callouts retain their correct meaning;
- normalized charts do not rebase when zoomed;
- economic calculations and datasets are unchanged;
- accessibility is supported outside the canvas;
- future compatible charts inherit zoom through the shared boundary;
- documentation is current;
- all checks pass;
- the focused commit is pushed;
- the branch is synchronized and the working tree is clean.
