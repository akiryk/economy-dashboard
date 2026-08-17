# Story 92B — Add international comparison data infrastructure

Status: complete

## Goal

Fetch, normalize, validate, and atomically persist the approved OECD comparison
metrics without browser network requests or loss of last-known-good data.

## Acceptance criteria

- Stable country definitions and a strict comparison-data schema exist.
- OECD CSV parsing verifies source identity and semantic dimension codes.
- Missing/stale/failed states remain distinct and missing never becomes zero.
- U.S. presence, 8-of-10 coverage, dates, units, and duplicate checks are enforced.
- Transient fetches retry narrowly; invalid results never replace committed data.
- Refresh integrates with the scheduled pipeline and has fixture-based tests.
- A validated committed snapshot contains every approved Version 1 metric.
