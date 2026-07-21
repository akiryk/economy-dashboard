# Story 37 — Investigate and define a reusable compact-card architecture

## User story

As a dashboard maintainer, I want a reusable architecture for collapsed economic cards and compact historical-band charts so that successful patterns from the first card can be rolled out consistently and changed from one place.

## Scope

Audit the completed Real GDP compact card and define the smallest reusable architecture for later cards. Identify shared composition, chart, statistical, styling, accessibility, and exception boundaries without migrating another card or building a universal schema-driven framework.

## Deliverable

The accepted decision is recorded in [`../compact-card-architecture.md`](../compact-card-architecture.md). It covers current state, duplication risks, proposed interfaces and tokens, per-card configuration, escape hatches, migration, testing, and whether refactoring should precede Card #2.

## Decision

No production refactor is justified with only one demonstrated compact card. Card #2 should introduce and prove the smallest shared layout first; historical-band derivation, chart, help, and theme boundaries should be extracted only where the second metric demonstrates the same behavior. No additional card is migrated in this story.
