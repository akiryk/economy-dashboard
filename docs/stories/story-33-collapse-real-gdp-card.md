# Story 33 — Collapse the Real GDP growth card by default

## User story

As a dashboard user, I want the Real GDP growth card to show only its essential headline content by default so that I can scan the dashboard quickly and open the full research detail only when I need it.

## Scope

This progressive-disclosure trial applies only to **Is the U.S. economy growing?** It does not change GDP data, calculations, narrative, chart behavior, sources, metadata, tables, or other cards.

## Requirements

The collapsed card shows, in order:

1. Economic growth eyebrow
2. Card question
3. Real GDP measure description
4. Existing latest-value callout, period, and units
5. Full-width More button

The chart, controls, narrative, related context, sources, metadata, and observation table remain absent from the collapsed interaction tree. More reveals the complete existing research content in place and changes to Less. The control exposes `aria-expanded` and `aria-controls` and is keyboard operable.

Range and zoom state survive collapse and reopening. The chart is not initialized while hidden, preventing it from reserving expanded height or receiving an invalid hidden-container size. No compact-chart placeholder is included; the compact historical-band chart belongs to the next story.

## Acceptance criteria

- Real GDP is collapsed on first render; every other research card is unchanged.
- The headline callout remains readable and available to assistive technology.
- Expanded chart controls, zoom, source links, disclosures, and semantic table retain their current behavior.
- Hidden expanded content is not focusable.
- More/Less has correct state, reading order, and keyboard behavior.
- Chart range state survives collapse and reopening.
- Desktop and narrow layouts have no page-level horizontal overflow.
- Loading and failure remain isolated at card level.

## Verification

Completion requires lint, typecheck, tests, production build, `git diff --check`, desktop and narrow browser review, keyboard review, expanded chart sizing review, and a committed and pushed implementation.
