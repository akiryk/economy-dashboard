# User Story 87 — Automate BLS inflation-contribution updates

## Status

Complete under the source-access acceptance criteria below.

The repository implements official-source discovery, download, validation, and
atomic ingestion for BLS News Release Table 7 workbooks. Ordinary GitHub-hosted
Actions runners currently receive HTTP 403 from the official BLS supplemental
files page. That source-imposed restriction is a supported steady-state outcome,
not an unfinished implementation requirement.

## User story

As a dashboard maintainer, I want the scheduled refresh to attempt safe,
official-source Table 7 ingestion and handle source access restrictions
deterministically, so contribution data is never corrupted and unrelated
economic updates continue even when BLS blocks automated workbook retrieval.

## Scope

This story covers the BLS News Release Table 7 percentage-point contribution
effects that power **What is driving inflation?** It does not replace those
effects with category inflation rates or another contribution methodology.

The supporting shelter, energy, and food category-rate histories are separate
BLS API inputs. They update automatically through `npm run data:refresh` and do
not establish that Table 7 workbook retrieval succeeded.

## Required behavior

### Official source only

The scheduled workflow attempts discovery and retrieval from the official BLS
CPI supplemental-files source. It must not use search results, unofficial
mirrors, third-party copies, spoofed access, or redirects to unapproved hosts.

### Successful official access

If BLS permits retrieval, the updater:

1. discovers links named **News Release Table 7, [Month] [Year] (XLSX)**;
2. compares the newest release with the latest committed contribution period;
3. performs a no-op when the periods match;
4. downloads only a release exactly one month newer;
5. processes it through the same parser and validation rules as manual
   ingestion;
6. atomically updates history and the card snapshot only after all validation
   succeeds; and
7. participates in the normal verification, commit, and deployment gates.

### Source-imposed access restriction

An official-host access-denied response such as HTTP 403 means automatic release
freshness could not be determined. It is not “no new release.” In this state the
scheduled workflow must:

- preserve the last valid contribution dataset unchanged;
- report the source-access restriction clearly in workflow diagnostics;
- retain manual ingestion as the supported update path;
- continue unrelated API-fed refreshes, repository verification, and deployment;
- avoid unofficial sources or attempts to bypass the restriction; and
- leave the automatic path ready to work without redesign if BLS later permits
  GitHub-hosted access.

### Retrieved but invalid source

Access denial is distinct from a failure after successful retrieval. A malformed
or non-XLSX response, unexpected Table 7 structure, missing or duplicate
category, nonnumeric contribution, suspicious/stale/future period, multi-month
gap, reconciliation failure, duplicate history period, or history truncation
must fail safely. Such failures must never replace good committed data.

### Manual fallback

While official automated retrieval is blocked, a maintainer manually downloads
each new official Table 7 workbook and runs:

```bash
npm run data:ingest-inflation-contribution -- \
  --file /path/to/news-release-table7-YYYYMM.xlsx \
  --period YYYY-MM-01 \
  --release-date YYYY-MM-DD \
  --source-url https://www.bls.gov/cpi/tables/supplemental-files/news-release-table7-YYYYMM.xlsx \
  --output /tmp/inflation-contribution-release.json
```

The validated result must then be appended through the shared update rules,
verified, committed, and deployed without truncating existing history.

## Acceptance criteria

1. The scheduled workflow attempts Table 7 retrieval only from the approved
   official BLS host.
2. A successful response uses semantic release discovery and the existing shared
   parser and validators.
3. Same-period discovery is a clean no-op with no metadata churn.
4. A valid release exactly one month newer is validated before atomic
   persistence.
5. Official-host access denial is classified as automatic retrieval unavailable,
   not as “no new release.”
6. Access denial preserves contribution data and is clearly visible in workflow
   diagnostics.
7. Access denial does not block unrelated economic refreshes, verification, or
   deployment.
8. The manual ingestion command remains supported while automatic retrieval is
   unavailable.
9. A malformed, suspicious, or invalid workbook after successful retrieval still
   causes a safe blocking failure.
10. Supporting category-rate series refresh automatically through their separate
    official BLS API path.
11. Tests use controlled fixtures and do not hard-code the current latest release
    month.
12. No economic data, contribution semantics, or card UI is changed by this
    documentation follow-up.

Successful GitHub-hosted workbook retrieval is not required for completion when
the official BLS host demonstrably blocks that environment. The required proof
is deterministic handling of the source restriction while preserving data and
the rest of the release pipeline.

## Verification

- Confirm a controlled successful response exercises discovery, download,
  parsing, validation, and atomic persistence.
- Confirm same-period discovery is a no-op.
- Confirm controlled access denial is distinguishable from “no new release” and
  does not modify contribution files.
- Confirm malformed and suspicious retrieved sources fail safely.
- Confirm the scheduled workflow reports the demonstrated official BLS HTTP 403
  while allowing unrelated refresh, verification, and deployment to succeed.
- Confirm supporting category-rate histories refresh independently.
- Run `npm run verify`.
- Run `git diff --check`.

## Known external limitation

As of August 14, 2026, the official BLS supplemental-files host returns HTTP 403
to ordinary GitHub-hosted Actions runners. Manual ingestion is therefore still
required for each new Table 7 contribution release. This limitation does not
apply to the supporting category-rate series retrieved from the BLS Public Data
API.
