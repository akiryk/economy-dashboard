# Story 35 — Build an isolated compact historical-band chart for Real GDP growth

## User story

As a dashboard user, I want a compact chart that combines the recent GDP-growth path with historical reference bands so that I can see trajectory and historical context at a glance.

## Scope

Build an isolated, responsive ECharts fixture from Story 34's domain output. Do not integrate it into the production GDP card or change GDP calculations, the More/Less interaction, or the full research chart.

## Requirements

- Plot the latest 12 quarterly observations without smoothing or connecting null gaps.
- Draw the 10th–90th percentile outer band and 25th–75th percentile inner band.
- Include zero as a dashed reference and mark the latest observation.
- Hide axes, legend, title, controls, zoom, and toolbox.
- Use an unbroken padded y-domain containing recent finite values, outer bounds, and zero.
- Provide a concise tooltip and deterministic factual accessible summary.
- Return an unavailable state instead of false bands when Story 34 evidence is insufficient.
- Review the isolated fixture at compact desktop and narrow widths.

## Review surface

The lazy-loaded fixture is available at `/previews/gdp-compact-chart`. It must remain absent from the production dashboard card until a later approved integration story.

## Verification

Completion requires option, domain, missing-data, lifecycle, and accessibility tests; lint; typecheck; full tests; production build; compact and narrow browser review; `git diff --check`; and committed documentation and review evidence.
