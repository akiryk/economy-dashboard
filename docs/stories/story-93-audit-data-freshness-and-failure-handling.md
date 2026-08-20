# Story 93 — Audit data freshness, retrieval cadence, and failure handling

Status: complete

## Goal

Create a complete operational audit for every visible measure on `/`,
`/dashboard`, and `/compare`, including source ownership, publication and check
cadence, current freshness, failure isolation, recovery responsibility, and
recommended follow-up work.

## Constraints

- Investigation and documentation only.
- Do not change providers, data, schedules, retrieval behavior, runtime
  architecture, or warning UI.
- Cross-check documentation against route composition, refresh commands,
  workflow configuration, committed artifacts, recent workflow runs, and
  authoritative provider schedules.

## Deliverable

[`../data-operations.md`](../data-operations.md) is the canonical operational
matrix, freshness-contract registry, and stale-data incident runbook.
