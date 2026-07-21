# Story 36 — Integrate the compact historical-band chart into the collapsed Real GDP growth card

## User story

As a dashboard user, I want the compact GDP historical-band chart included in the collapsed growth card so that I can see recent trajectory and historical context without opening the full research view.

## Scope

Integrate the approved Stories 34–35 model and chart only into **Is the U.S. economy growing?** Preserve the statistics, compact-chart design, full research chart, GDP data, and every other card.

## Requirements

- Collapsed order is eyebrow, question, measure, latest callout, compact summary figure, and More.
- Wide and laptop layouts place callout and compact chart side by side; narrow layouts stack them.
- More retains the headline and compact chart while revealing the unchanged research content.
- Less hides only the research content.
- Compact and full charts share the already loaded committed series without another provider request.
- Both ECharts instances initialize and resize independently through the existing deferred bundle.
- Compact failure remains isolated from the callout and disclosure control.
- The compact figure exposes its deterministic summary once; hidden research controls remain non-focusable.

## Verification

Completion requires deterministic integration and accessibility tests, lint, typecheck, full tests, build, wide/laptop/narrow browser review, dual-chart sizing and control review, keyboard review, no-overflow review, `git diff --check`, documentation, commit, and push.
