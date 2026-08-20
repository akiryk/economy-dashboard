# Data operations, freshness contracts, and incident response

This is the canonical operational view of data used by every visible card and
tile on `/`, `/dashboard`, and `/compare`. It answers: **Should newer data
exist, how can an agent determine what went wrong, and what should happen
next?** The audit snapshot is dated **August 19, 2026**.

[`data-refresh.md`](data-refresh.md) remains authoritative for exact
transformations, validation rules, generated coverage, and implementation
details. [`product-overview.md`](product-overview.md) remains authoritative for
the visible product inventory and interpretation. This document owns the
mapping between those inventories and the operational freshness contracts; do
not duplicate this matrix elsewhere.

## Operating model and responsibility

Providers publish data; repository refresh commands retrieve and validate it;
GitHub Actions checks for changes; committed JSON is the browser's only data
source; GitHub Pages serves the last successfully verified artifact. The normal
schedule is daily at 09:17 UTC. It is a **check cadence**, not a claim that each
provider publishes daily.

Responsibility is assigned by state:

- **Automation** owns scheduled retrieval, validation, dataset-only commits,
  and deployment for sources marked automatic.
- **The agent handling a data incident** owns diagnosis, log inspection,
  reproducible repair, verification, push, and production confirmation.
- **The product owner** owns credentials and decisions to change, replace, or
  license a provider. The agent must request the smallest exact action needed.
- **The product owner or an explicitly delegated operator** downloads official
  BLS Table 7 workbooks while GitHub-hosted retrieval remains blocked. An agent
  may run the existing validated ingestion command once the official workbook
  is available locally.

An old observation is not inherently stale. Apply its contract against the
official release calendar and actual provider state. Never use an unofficial
mirror, proxy series, carried-forward value, fabricated observation, or new
provider merely to make a date look current.

## Current audit summary

The last deployed data commit before this audit is `e137a1a` from the successful
August 18 scheduled run. The August 19 run
([GitHub Actions 32239773038](https://github.com/akiryk/economy-dashboard/actions/runs/32239773038))
retrieved and validated newer data, but verification failed before commit and
deployment because four tests asserted release-sensitive display values. The
failures covered July housing starts, July manufacturing output, July capacity
utilization on the non-audited `/secondary` route, and paired compact-chart
values. Production correctly retained the last verified artifact. This is a
**repository verification failure after successful retrieval**, not a provider
delay. Story 93 documents it but does not change tests or data.

At the audit date, the visible data are otherwise consistent with their normal
publication lags. Notable states are:

- July BLS employment and CPI data are current.
- June JOLTS is current; July is scheduled for September 1.
- Q2 GDP, business investment, productivity, and international GDP are current.
- Freddie Mac's August 13 weekly rate is current on Wednesday, August 19; the
  next normal PMMS publication is Thursday, August 20 at noon ET.
- July BLS Table 7 contributions are committed through the manual fallback.
- Daily S&P 500 data are committed through the August 17 close in the August 18
  artifact. This is suitable for a delayed end-of-day dashboard, not for an
  intraday market product.
- The July housing and manufacturing observations published August 18 were
  retrieved by the August 19 workflow but did not reach production because of
  the test failure described above.

### Provider cross-checks on August 19, 2026

These checks use authoritative release calendars/pages where practical. “Current”
means current under the applicable contract, not equal to today's date.

| Source family | Authoritative state | Deployed state | Assessment |
|---|---|---|---|
| BLS Employment Situation | July released Aug 7 | July | Current |
| BLS CPI/real earnings | July released Aug 12 | July | Current |
| BLS JOLTS | June released Aug 4; July due Sep 1 | June | Current |
| BLS productivity | 2026 Q2 initial released Aug 6 | 2026 Q2 | Current |
| BEA GDP | 2026 Q2 advance available; second estimate due Aug 26 | 2026 Q2 | Current; revisions expected |
| BEA Personal Income and Outlays | June available; July due Aug 26 | June | Current |
| Census housing starts | July released Aug 18 | June | Known newer data retrieved; blocked by verification failure |
| Federal Reserve G.17 manufacturing | July released Aug 18 | June | Known newer data retrieved; blocked by verification failure |
| Freddie Mac PMMS | Aug 13 is latest before Aug 20 Thursday release | Aug 13 | Current |
| BLS Table 7 | July workbook available with July CPI release | July | Current through manual fallback |
| S&P 500 via FRED | Business-day closing series; recheck FRED after each close | Aug 17 | Warning while Aug 19 workflow failure prevents normal advancement; not a real-time breach |
| OECD | Mixed peer periods accepted by configured 3-month/2-quarter limits | Apr–Jul or Q1–Q2 | Current under peer-specific limits |
| HOAM / BEA distribution / Fed research tables | No stable dated calendar for exact next update | May 2026 / 2023 / publication-vintage dates | No known provider advancement; quarterly manual review still needed |

## Visible-measure matrix

The **Contract** column joins each UI row to the operational source table below,
which supplies provider, exact identifier, publication timing, command,
automation status, freshness rule, failure isolation, human responsibility,
runbook, and production verification. Dates are the latest committed/deployed
observations at the audit snapshot. A quarter stored as its first calendar date
is shown here as the user-facing quarter.

### Research dashboard (`/`) — 25 cards

| # | Card | Primary and materially visible supporting data | Latest committed | Contract |
|---:|---|---|---|---|
| 1 | Is the U.S. economy growing? | `GDPC1` → `real-gdp-growth.json` | 2026 Q2 | BEA-Q |
| 2 | Is economic output growing faster than the population? | `A939RX0Q048SBEA` → `real-gdp-per-capita-growth.json` | 2026 Q2 | BEA-Q |
| 3 | Is the economy producing more per hour worked? | `OPHNFB` → `labor-productivity-level.json`, `labor-productivity-growth.json` | 2026 Q2 | BLS-PROD |
| 4 | What’s the inflation rate? | `CPIAUCNS` → `headline-cpi-inflation.json`; `CPILFESL` → `core-cpi-inflation.json`; `PCEPI` → `headline-pce-inflation.json` | CPI Jul 2026; PCE Jun 2026 | BLS-CPI, BEA-M |
| 5 | What is inflation doing recently? | `CPIAUCNS`, `CPIAUCSL`, `CPILFESL` → headline/core index, 3-month, and 12-month JSON files | Jul 2026 | BLS-CPI |
| 6 | Are workers’ wages keeping up with prices? | `CES0500000003`, `CPIAUCSL` → `nominal-wage-growth.json`, `real-wage-growth.json`, `headline-cpi-inflation-seasonally-adjusted.json` | Jul 2026 | BLS-EMP, BLS-CPI |
| 7 | What is driving inflation? | Table 7 → `inflation-contributions.json`, `inflation-contribution-history.json`; category IDs → shelter/energy/food CPI JSON | Jul 2026 | BLS-T7, BLS-CPI |
| 8 | Is unemployment high or low? | `UNRATE` → `unemployment-rate.json` | Jul 2026 | BLS-EMP |
| 9 | What share of prime-age adults are employed? | `LNS12300060` → `prime-age-employment-ratio.json` | Jul 2026 | BLS-EMP |
| 10 | Are employers adding jobs? | `PAYEMS` → `monthly-payroll-change.json`, `payroll-growth.json` | Jul 2026 | BLS-EMP |
| 11 | Is job growth keeping up with the labor force? | Federal Reserve Figure 2 plus `PAYEMS` → `estimated-breakeven-employment-growth.json`, `job-growth-breakeven-comparison.json` | actual comparison through 2026 Q2; source projections through Q4 | FED-RESEARCH, BLS-EMP |
| 12 | Are layoffs beginning to rise? | `JTSLDR`, `ICSA`, `IC4WSA` → matching layoffs/claims JSON files | JOLTS Jun 2026; claims week ending Aug 8 | BLS-JOLTS, DOL-W |
| 13 | Are households saving less of their income? | `PSAVERT` → `personal-saving-rate.json`; BEA workbook → `saving-rate-by-income-decile.json` | Jun 2026; distribution 2023 | BEA-M, BEA-IRR |
| 14 | How much of a median household’s income would it take to own a typical home? | Atlanta Fed national HOAM workbook → `home-ownership-cost-share.json` | May 2026 | HOAM-M |
| 15 | How much new housing is being started? | `HOUST`, `POPTHM` → matching JSON; Census detail IDs → `housing-construction-details.json`, `housing-supply-composition.json` | headline Jun 2026; July retrieved but blocked | CENSUS-HOUSING, BEA-M |
| 16 | Are U.S. manufacturers producing more goods? | `IPMAN` → `manufacturing-output.json` | Jun 2026; July retrieved but blocked | FED-G17 |
| 17 | Are businesses investing more in productive assets? | `PNFIC1` → `real-business-investment-level.json`, `real-business-investment-growth.json` | 2026 Q2 | BEA-Q |
| 18 | How large are corporate profits relative to the economy? | `CPATAX / GDP` → `corporate-profit-share.json` | 2026 Q1 | BEA-Q |
| 19 | Where has the Fed set short-term interest rates? | `DFEDTARL`, `DFEDTARU`, historical `DFEDTAR`; supporting `DFF`, `DPRIME` | effective state Aug 17, 2026 | FED-POLICY |
| 20 | Is the yield curve inverted? | `GS10`, `TB3MS`, `FEDFUNDS` → ten-year, three-month, and effective-rate JSON files | Jul 2026 | FED-RATES-M |
| 21 | How high are mortgage rates? | `MORTGAGE30US` → `mortgage-rate-30-year.json` | Aug 13, 2026 | PMMS-W |
| 22 | How large is the federal budget deficit relative to the economy? | `FYFSGDA188S` → `federal-budget-balance.json` | FY 2025 | FISCAL |
| 23 | How large is federal debt held by the public relative to the economy? | `FYGFGDQ188S` → `federal-debt-held-by-public.json` | 2026 Q1 | FISCAL |
| 24 | How large is the U.S. trade deficit relative to the economy? | `A019RE1Q156NBEA` plus four trade-component IDs → `trade-balance-share-of-gdp.json` and four component JSON files | 2026 Q2 | BEA-Q |
| 25 | How heavily are imported goods being taxed? | `B235RC1Q027SBEA / A255RC1Q027SBEA` → `effective-tariff-burden.json`; Fed Figure 5 → `core-goods-pce-inflation.json` | 2026 Q2; context Feb 2026 | BEA-Q, FED-RESEARCH |

### Status board (`/dashboard`) — 10 tiles

| # | Tile | Primary/supporting data | Latest committed | Contract |
|---:|---|---|---|---|
| 1 | GDP growth | Shared `GDPC1` year-over-year series | 2026 Q2 | BEA-Q |
| 2 | Unemployment | Shared `UNRATE` | Jul 2026 | BLS-EMP |
| 3 | Payroll growth | FRED `units=chg` on `PAYEMS`, displayed as complete 3-month average plus latest month | Jul 2026 | BLS-EMP |
| 4 | Initial claims | `IC4WSA` plus `ICSA` | week ending Aug 8 | DOL-W |
| 5 | Inflation | FRED `units=pc1` on `CPIAUCNS` | Jul 2026 | BLS-CPI |
| 6 | Real wage growth | Shared exact-ratio `CES0500000003 / CPIAUCSL` derivation | Jul 2026 | BLS-EMP, BLS-CPI |
| 7 | Sahm Rule | `SAHMREALTIME` | Jul 2026 | BLS-EMP |
| 8 | 30-year mortgage rate | `MORTGAGE30US` | Aug 13, 2026 | PMMS-W |
| 9 | S&P 500 | FRED `SP500`, daily close | Aug 17, 2026 | MARKET-D |
| 10 | High-yield spread | FRED `BAMLH0A0HYM2`, daily | Aug 14, 2026 | MARKET-D |

### International comparison (`/compare`) — five measures

| # | Measure | Exact OECD dataflow | Latest committed across peers | Contract |
|---:|---|---|---|---|
| 1 | Prime-age employment | `DSD_LFS@DF_IALFS_EMP_WAP_Q` v1.0 | 2026 Q1–Q2 | OECD |
| 2 | Unemployment | `DSD_LFS@DF_IALFS_UNE_M` v1.0 | Apr–Jul 2026 | OECD |
| 3 | Headline inflation | `DSD_G20_PRICES@DF_G20_PRICES` v1.0 | Jun–Jul 2026; Spain unavailable | OECD |
| 4 | Real GDP growth | `DSD_NAMAIN1@DF_QNA_EXPENDITURE_GROWTH_OECD` v1.1 | 2026 Q1–Q2 | OECD |
| 5 | Ten-year government yield | `DSD_STES@DF_FINMARK` v4.0 | Jun 2026 | OECD |

## Source registry and freshness contracts

Every automatic source is checked by `refresh-and-deploy.yml` on scheduled and
manual runs. `data:refresh` includes the FRED foundation, BLS category CPI,
BEA saving distribution, Census housing details, Atlanta Fed HOAM, and Federal
Reserve core-goods PCE paths. Table 7 and OECD are separate workflow steps.
Push-triggered runs verify and deploy committed data but intentionally do not
contact providers.

The canonical machine-readable mapping is
`src/features/data-freshness/freshnessRegistry.ts`. It assigns every materially
visible research-card, status-tile, and comparison dataset to one or more of the
contracts below. `evaluateFreshness.ts` evaluates supplied provider/release and
pipeline evidence without consulting the browser, mutating economic data, or
using a generic age limit. Its structured result identifies the dataset,
contract, deployed and provider periods, state, reason, required human action,
and diagnostic detail. A failure while evaluating one dataset is isolated as an
indeterminate warning for that dataset.

During an incident, inspect committed artifacts with:

```bash
npm run data:freshness -- --dataset housing-starts
```

Omit `--dataset` for the complete JSON report. This command deliberately makes
no live provider requests: it verifies and reports the committed observation,
then returns `warning` because provider/release evidence is unavailable. Refresh
automation and future alerting consumers can pass provider checks, completed
release/market-day counts, manual-review evidence, OECD peer coverage, or a
pipeline failure to the same evaluator. Do not interpret the inspection
command's warning as proof that the economic data are stale.

### Structured workflow diagnostics and owner alerts

Every refresh/build run classifies actionable failures using the canonical
diagnostic categories in
`src/features/data-freshness/operationalDiagnostics.ts`. The workflow uploads an
`operational-diagnostics` JSON artifact containing the affected dataset group,
freshness contracts, category, pipeline stage, timestamp, retry status,
last-known-good preservation status, action requirement, concise reason, and
run URL. Detailed step logs remain the place to diagnose the underlying error;
diagnostic text must never contain credentials, response bodies that may include
secrets, or raw environment values.

The existing GitHub Issues notification channel is the owner alert mechanism.
An actionable refresh/build/deployment incident opens the single issue titled
`[Data operations] Refresh or deployment requires attention`. The workflow
updates that issue only when the diagnostic fingerprint changes, so an unchanged
incident does not notify on every daily run. A successful later workflow adds a
recovery comment and closes the issue. Subscribe to repository issue
notifications to receive these alerts outside GitHub.

No issue is opened for a release that is not due, a provider that has not yet
advanced, or a transient request that succeeds within its bounded retries. An
OECD command failure occurs only after its bounded retries are exhausted and is
therefore classified as a repeated refresh failure. Manual-source reminders are
separate operational work; the known Table 7 access diagnostic does not create
an alert under this mechanism.

During an incident, open the linked workflow run, download its
`operational-diagnostics` artifact, identify the failed step, and follow the
source-specific contract and incident runbook below. A diagnostic says what the
workflow established; an `unknown-failure` does not assign fault to a provider.

### Manual-source and irregular-source reminders

The scheduled workflow also runs `npm run operations:reminders`. Its
`manual-source-reminders` JSON artifact is derived from committed source periods,
the freshness registry, and the persistent review state in
`config/manual-source-reviews.json`. Outstanding reminders use the same GitHub
Issues mechanism as operational alerts, under the separate title
`[Data operations] Manual source review required`. A reminder is planned work,
not a pipeline failure.

For Table 7, a reminder is keyed to the newest CPI month when the committed
Table 7 history ends earlier. Repeated daily runs keep the same key and do not
renotify. After the official workbook is validated, committed, and deployed,
the periods match, the condition clears, and the workflow closes the issue. A
later CPI month creates a new reminder. The owner or agent must still download
from the official BLS page and use the documented manual ingestion path; an
HTTP 403 never means that no release exists.

`FED-RESEARCH` and `BEA-IRR` receive 92-day official-page reviews. `HOAM-M`
receives a 62-day review because its automatic workbook check has no dependable
dated release calendar and an unchanged workbook needs periodic confirmation.
The dates are review intervals, not claims about publication dates and not age
limits on the economic observations. Inspect current state with:

```bash
npm run operations:reminders
```

After actually checking the official source, record the review and exact
observed version with:

```bash
npm run operations:record-source-review -- \
  --source FED-RESEARCH \
  --reviewed-at 2026-11-19T18:00:00.000Z \
  --observed-version "Figure 2 remains dated 2026-04-02"
```

Review the resulting JSON diff, then verify, commit, push, and deploy it. Never
advance a review date without checking the official URL stored in that file.

### Public freshness presentation

The application reads the sanitized static `data-freshness.json` manifest once
at startup. It does not poll, contact providers, compare observation ages, or
run release-calendar logic in React. The build workflow derives manual-review
exceptions from the operational reminder state before building; other consumers
may publish evaluator results through the same minimal schema. Operational
categories, stack traces, workflow names, file paths, and provider-response
details are never included in the public manifest.

Healthy datasets render no extra UI. `late-provider` appears as a neutral source
delay, `warning` as a non-alarming review/confirmation notice, and
`unexpectedly-stale` or `failure` as a stronger textual alert. Observation dates
remain visible. Research cards scope the notice across their materially visible
primary/supporting datasets, status tiles use the same dataset keys, and OECD
uses only the snapshot-level contract; accepted country-specific lag continues
to appear as the existing stale/N/A row treatment rather than a global warning.

**State vocabulary**

- **Healthy:** the latest release expected by the contract is deployed.
- **Late, provider not advanced:** the release window passed, but the official
  source has not published; report source delay and continue daily checks.
- **Warning:** a release may exist, but source access or an irregular schedule
  prevents automatic determination; inspect manually.
- **Unexpectedly stale:** the official source has advanced and the next
  applicable scheduled check completed without that observation reaching
  production, or a source-specific grace period expired.
- **Failure:** retrieval, parsing, validation, derivation, persistence, push,
  verification, or deployment prevented a known available release from reaching
  production.

| Contract | Provider and exact source | Publication and revision behavior | Command; check/status | Healthy / unexpectedly stale | Isolation, human action, and verification |
|---|---|---|---|---|---|
| BEA-Q | BEA via FRED: `GDPC1`, `A939RX0Q048SBEA`, `PNFIC1`, `CPATAX`, `GDP`, `A019RE1Q156NBEA`, trade components, customs duties/imports | Quarterly GDP advance, second, and third estimates on BEA's dated calendar; revisions are normal. Corporate profits generally begin with the second estimate. | `npm run data:refresh`; automatic daily | Healthy through the newest applicable BEA estimate. Late if BEA reschedules. Unexpected after BEA/FRED has advanced and one subsequent successful daily check/deploy has not. | Series/groups preserve prior valid data. Inspect BEA calendar, FRED observation, workflow and derivation logs. Repair code/schema or credentials; verify JSON and production period. |
| BEA-M | BEA via FRED: `PCEPI`, `PSAVERT`, `POPTHM` | Monthly Personal Income and Outlays on BEA calendar, commonly about one month after reference month; revisions occur. Population timing is source-dependent. | `data:refresh`; automatic daily | Use the BEA release calendar, not age alone. Unexpected after official/FRED advancement plus one successful daily cycle. | Same as BEA-Q. A provider delay is wait-and-monitor, not a code failure. |
| BEA-IRR | BEA Distribution of Personal Saving official `joint_dist_summary.xlsx` | Annual research product with no dependable fixed release date; revisions/status changes possible. | `data:refresh` (`data:refresh-saving-distribution`); automatic daily | Healthy when workbook is unchanged. Warning—not automatic failure—if a new BEA publication is announced but absent. Unexpected only when official workbook advanced and a daily run did not ingest it. | Daily checking is more frequent than useful but harmless. Manually inspect BEA research page at least quarterly until a machine-readable release signal exists. Repair parser for valid schema changes; owner decides methodology/provider changes. |
| BLS-EMP | BLS Employment Situation via FRED: `UNRATE`, `LNS12300060`, `PAYEMS`, `CES0500000003`; `SAHMREALTIME` via FRED | Monthly, normally early the following month on the BLS calendar. Payroll/wage estimates receive monthly and annual benchmark revisions. | `data:refresh`; automatic daily | Healthy when the latest scheduled Employment Situation month is deployed. Before release: healthy. After BLS release but before FRED propagation: late/provider not advanced. Unexpected after FRED advanced plus one successful daily cycle. | Grouped payroll and wage derivations preserve prior files. Inspect BLS release, FRED, workflow, then parsing/derivation tests. Never force a rounded BLS result into component-derived real wages. |
| BLS-CPI | BLS CPI release via FRED (`CPIAUCNS`, `CPIAUCSL`, `CPILFESL`) and BLS API category indexes (`CUUR0000SAH1`, `CUUR0000SA0E`, `CUUR0000SAF1`) | Monthly on the BLS calendar, generally around mid-month for the prior month; seasonal factors and indexes may be revised under source policy. | `data:refresh`; automatic daily | Healthy through latest scheduled CPI month. Unexpected after official/FRED or BLS API advancement plus one successful daily cycle. | CPI files replace as one rollback-protected group; category files do likewise. Inspect source IDs, exact months, gaps, and workflow. Parser/validation failures require code repair, never interpolation. |
| BLS-T7 | Official BLS CPI News Release Table 7 XLSX from `https://www.bls.gov/cpi/tables/supplemental-files/home.htm` | Monthly with CPI release; release workbooks may be revised. GitHub-hosted runners currently receive HTTP 403. | `data:refresh-inflation-contributions`; scheduled discovery diagnostic is nonblocking; **manual ingestion currently required** | Healthy only when the newest official Table 7 release has been manually validated, committed, and deployed. Access denial is warning/unknown, never “no release.” On each CPI release day, check the official page; notify the owner if its month exceeds committed history. | Owner downloads official workbook. Agent runs documented `data:ingest-inflation-contribution` path, validates period/reconciliation/history, verifies, commits, deploys. No mirrors, spoofing, or substitute tables. |
| BLS-JOLTS | BLS JOLTS `JTSLDR` via FRED | Monthly on a separately dated BLS calendar, usually roughly one month later than the Employment Situation; revisions occur. | `data:refresh`; automatic daily | Healthy through the latest scheduled JOLTS reference month. Example: June 2026 is healthy until the July release on Sep 1. Unexpected after official/FRED advancement plus one successful daily cycle. | Do not judge by the current calendar month. Inspect the JOLTS calendar and FRED before diagnosing. Preserve prior data on failure. |
| BLS-PROD | BLS nonfarm-business productivity `OPHNFB` via FRED | Quarterly initial and revised releases, tied to BEA GDP schedule; revisions are expected. | `data:refresh`; automatic daily | Healthy through latest scheduled initial/revision. Unexpected after FRED advanced plus one successful daily cycle. | Validate level and derived growth as one group; repair alignment/schema rather than substituting a different productivity measure. |
| DOL-W | ETA weekly claims `ICSA`, official `IC4WSA`, via FRED | Weekly, normally Thursday 8:30 ET for week ending the prior Saturday; revised following week. | `data:refresh`; automatic daily | Healthy before Thursday with prior week's value; after release allow FRED propagation and the next successful daily cycle. More than one expected weekly release behind is unexpected. | Inspect DOL release and FRED. Wait for confirmed provider lag; repair retrieval for known available data. Both series remain separate and missing weeks are not filled. |
| CENSUS-HOUSING | Census/HUD via FRED: regions `HOUSTNE/HOUSTMW/HOUSTS/HOUSTW`; population `CNERPOP/CMWRPOP/CSOUPOP/CWSTPOP`; permits `PERMIT/PERMIT1/PERMIT24/PERMIT5`; starts `HOUST/HOUST1F/HOUST2F/HOUST5F`; under construction `UNDCONTSA/UNDCON1USA/UNDCON24USA/UNDCON5MUSA`; completions `COMPUTSA/COMPU1USA/COMPU24USA/COMPU5MUSA`; seven `NHSUSSP*` price buckets; size `COMPSFLAM1FQ` | Headline monthly, usually the 12th workday; revised permits later and annual/quarterly detail on source-specific schedules. Revisions are normal. | `data:refresh`; automatic daily | Headline healthy through latest Census release month. Supporting annual/quarterly tables use their own published periods. Unexpected after official/FRED advancement plus one successful daily cycle. | Grouped detail writes preserve both files. Release-sensitive tests use controlled or dataset-derived expectations, so normal source advancement is accepted. Do not force all detail to the headline month. |
| FED-G17 | Federal Reserve G.17 `IPMAN` via FRED | Monthly at 9:15 ET on published dates; each release revises recent months and annual revisions can alter history. | `data:refresh`; automatic daily | Healthy through latest scheduled G.17 month. Unexpected after official/FRED advancement plus one successful daily cycle. | Preserve provider revisions and use controlled or dataset-derived test expectations. Investigate provider, retrieval, validation, and deployment evidence separately. |
| FED-POLICY | Federal Reserve/FOMC via FRED: `DFEDTARL`, `DFEDTARU`, discontinued `DFEDTAR`, plus `DFF`, `DPRIME` | Event-driven target changes after FOMC action; effective and prime rates can update on business days. An unchanged old effective state can be fully current. | `data:refresh`; automatic daily | Compare the current official target range, not observation age. Unexpected if an announced effective change is absent after FRED advances and one daily cycle. | Bounds validate on the exact date and replace coherently. Never invent a range or infer a policy change from market rates. |
| FED-RATES-M | Federal Reserve monthly averages via FRED: `GS10`, `TB3MS`, `FEDFUNDS` | Monthly averages after month end; underlying Treasury/Fed rates are daily but this card intentionally uses monthly series. Revisions are possible. | `data:refresh`; automatic daily | Healthy through most recently completed month once FRED publishes it. Current-month absence is normal. Unexpected after monthly series advances plus one cycle. | Do not substitute daily status-tile series into the research card without a product decision. Preserve exact monthly alignment. |
| FISCAL | BEA/Federal fiscal ratios via FRED: annual `FYFSGDA188S`, quarterly `FYGFGDQ188S` | Annual or quarterly national-accounts data with source-dependent lag and revisions. | `data:refresh`; automatic daily | Release-aware: compare the official/FRED series. Annual dates may be many months old and healthy. Unexpected only after provider advancement plus one cycle, or after two expected publication periods without a provider explanation. | Investigate provider calendar/series notes for discontinuation before changing sources. Owner decides any replacement. |
| HOAM-M | Atlanta Fed official national HOAM XLSX | Monthly, but publication lag is source-dependent and the page provides no stable dated release calendar; source inputs can be revised. | `data:refresh`; automatic daily | Healthy when official workbook matches committed month. Warning if retrieval succeeds unchanged for more than two months: manually inspect page/workbook. Unexpected when workbook advanced but one successful run did not ingest it. | Validate headers, dates, duplicates, history, and national field. Repair parser for valid workbook changes; owner decides methodology changes. |
| PMMS-W | Freddie Mac PMMS `MORTGAGE30US` via FRED | Weekly Thursday noon ET; Wednesday on a Thursday holiday. Methodology changed in 2022; revisions are possible. | `data:refresh`; automatic daily | Prior Thursday is healthy until the next publication. Allow FRED propagation and the next daily cycle; two weekly releases behind is unexpected. | Compare Freddie PMMS page, then FRED. Individual lender quotes are not a replacement for this weekly national benchmark. |
| MARKET-D | FRED `SP500` (S&P Dow Jones daily close, licensed ten-year history) and `BAMLH0A0HYM2` (ICE BofA daily spread) | Business-day/end-of-day data, subject to FRED/provider lag, market holidays, licensing, and revisions. | `data:refresh`; automatic daily | For this delayed dashboard, latest available FRED close through the prior business day is healthy. Two completed market days behind FRED is unexpected. Same-day or real-time freshness is outside the current contract. | Inspect market calendar, official FRED observation, workflow, and license notes. Provider replacement requires owner approval and licensing/architecture review. Never scrape an unofficial quote. |
| FED-RESEARCH | Federal Reserve Board [accessible Figure 2](https://www.federalreserve.gov/econres/notes/feds-notes/labor-force-growth-breakeven-employment-and-potential-gdp-growth-accessible-20260402.htm) and [accessible Figure 5](https://www.federalreserve.gov/econres/notes/feds-notes/detecting-tariff-effects-on-consumer-prices-in-real-time-part-II-accessible-20260408.htm) | Irregular publication-vintage research, no fixed update schedule. Figure 2 includes labeled projections; Figure 5 currently ends Feb 2026. | Breakeven: `data:refresh-job-growth-breakeven` (**not scheduled**). Figure 5: `data:refresh-core-goods-pce` (included in daily `data:refresh`). | No generic age threshold. Healthy while official publication is unchanged. Warning requires quarterly manual source-page review. Unexpected when official source changes/supersedes the table and repository remains unchanged after its applicable check. | Do not relabel projections as observations. Agent investigates official replacement/publication; owner decides whether a superseding source is definitionally compatible. |
| OECD | OECD Data Explorer SDMX dataflows listed in the UI matrix and `international-comparison-registry.md` | Mixed monthly/quarterly, heterogeneous national release timing and revisions. | `data:refresh-international`; automatic daily, nonblocking diagnostic; three bounded retries for timeouts/429/5xx | Healthy when U.S. is current, at least 8/10 peers are current, monthly peers trail newest by ≤3 periods and quarterly by ≤2. Older peers display stale/N/A. Unexpected when OECD advanced but complete validated snapshot cannot deploy for three consecutive daily checks. | Every failure preserves the full last-good snapshot and does not block unrelated data. Inspect OECD response/schema; repair version/dimensions only after authoritative review. Do not forward-fill peers. |

## Standard stale-data incident runbook

Follow every step; do not start by editing dates or tests.

1. **Identify ownership.** Find the page/card/tile above, list every primary and
   materially visible supporting dataset, and select its contract.
2. **Determine whether a release was expected.** Consult the official calendar
   or the contract's irregular-source rule. Weekends, holidays, publication
   lags, and revisions matter.
3. **Check the authoritative provider.** Record its newest period, publication
   time, revision status, and URL. For a FRED-carried series, distinguish the
   underlying agency release from FRED propagation.
4. **Compare artifacts.** Inspect the latest committed observation and
   `retrievedAt` in the relevant JSON. Check `origin/main`, not only a possibly
   old local checkout. Compare deployed `deployment-metadata.json` and the
   visible card's period.
5. **Trace the path.** Confirm the exact npm command, whether it participates in
   the daily workflow, and whether its workflow step is blocking, nonblocking,
   or manual.
6. **Inspect the applicable workflow.** Find the newest scheduled/manual run,
   then inspect the exact failed job, step, annotations, and logs. Determine
   whether newer data existed only in the uncommitted workflow workspace.
7. **Classify before acting:**
   - expected publication date has not arrived → healthy; wait;
   - date passed, provider not advanced → provider delay; monitor;
   - provider advanced, intermediary has not → propagation delay; retry next cycle;
   - network/429/5xx → transient access; use bounded retry, then monitor;
   - 401/403/missing secret → authentication/access restriction; replace the
     secret or follow the documented official manual path;
   - 404/redirect/dataflow mismatch → endpoint or provider change; investigate;
   - download succeeded, parse/schema/validation/derivation failed → preserve
     data and repair code with official fixtures;
   - write failed → inspect permissions/storage and atomic rollback;
   - verification failed after refresh → fix the release-sensitive test or real
     invariant; do not weaken corruption checks;
   - commit/push failed → preserve verified work and resolve auth/protection/
     non-fast-forward without force;
   - deployment failed → inspect Pages job and keep prior production artifact;
   - source discontinued/superseded → stop and escalate provider choice to owner.
8. **Use the assigned recovery.** Wait, allow bounded retry, repair retrieval or
   parsing, replace credentials interactively, use the official manual fallback,
   or request a provider decision. Never silently broaden scope.
9. **Never substitute unofficial data.** No mirror, scrape, proxy, interpolation,
   or fabricated current value is an acceptable freshness repair.
10. **Verify end to end.** Run the source command when applicable, `npm run
    verify`, and `git diff --check`; inspect the focused dataset diff; commit and
    push; monitor the exact workflow through build and Pages deployment; confirm
    the period in committed JSON, deployed metadata, and production UI.
11. **Record continuing responsibility.** Document any manual step, access
    restriction, irregular review date, accepted provider delay, or owner action.

## Failure-detection audit

| Condition | Can the current system distinguish it? | Gap/action |
|---|---|---|
| Provider has not released vs expected date not arrived | Yes when automation supplies the evaluator with release/provider evidence; otherwise the result is explicitly indeterminate. Table 7 remains indeterminate under the official-host 403. | Provider checks and release calendars must remain explicit evidence; the local inspection command does not contact providers. |
| Provider unreachable, timeout, HTTP error | Yes in command/workflow logs; OECD has bounded retry. Exhausted retries produce structured diagnostics and an owner issue. | Inspect the artifact and detailed failed-step log before attributing fault. |
| Authentication/authorization | HTTP/missing-secret errors are visible; Table 7 403 is explicitly classified. | Actionable workflow failures produce a deduplicated owner issue; Table 7 remains part of the separate manual-source process. |
| Endpoint/URL changed | Usually surfaces as HTTP, redirect-host, identity, or schema failure. | Requires agent investigation; discontinuation is not automatically inferred. |
| Parsing/schema/content change | Yes, provider-specific parsers and domain validation fail safely. | Diagnostics vary by source; preserve detailed non-secret reason. |
| Derived generation/validation/write failure | Yes; nonzero command and atomic/group rollback preserve good files. | The evaluator records a dataset-specific pipeline failure when supplied by automation. |
| Refresh succeeded but tests failed | Yes; workflow blocks commit/deploy and the evaluator supports a distinct verification-failure reason. | Tests use controlled or dataset-derived expectations so ordinary source advancement is not itself a failure. |
| Commit/push/deploy failed | Yes; explicit workflow stages preserve prior production and create/update the owner issue. | Follow its workflow link and structured category; recovery is recorded when a later run succeeds. |
| Manual ingestion required | Yes. Table 7 period mismatch and due irregular-source reviews create stable, deduplicated owner reminders. | Complete the documented official-source action; successful ingestion/review clears or advances the reminder state. |
| Source discontinued | Not reliably. | Periodic official-source review and explicit lifecycle state needed. |
| One dataset stale while global metadata looks recent | The per-dataset registry/evaluator can distinguish it when given provider and pipeline evidence; `latestDatasetDate` alone still cannot. | Future workflow diagnostics and alerts should persist and publish evaluator output. |

## Gap analysis

### Cadence appropriate

- Daily checking is operationally appropriate for FRED-backed monthly,
  quarterly, weekly, and daily series: it catches releases without encoding
  dozens of changing calendars, and unchanged retrieval dates are discarded.
- Daily is appropriate for BLS category CPI and Census housing details, although
  those sources publish monthly or less often.
- Weekly PMMS and claims are well served by daily checks.
- OECD's daily nonblocking check is reasonable because peer release timing is
  heterogeneous and the complete snapshot is protected.

### Checked more often than useful

- Annual BEA distributional saving and irregular Federal Reserve research tables
  do not need daily network traffic. The overhead is small, but quarterly source
  review plus release-aware checks would be clearer.
- Quarterly and annual FRED series are checked daily, but the shared request path
  and metadata-only suppression make this acceptable rather than harmful.

### Checked too infrequently or not at all

- The breakeven Figure 2 command is not scheduled. Its 92-day official-page
  review is persisted in the manual-source review state and produces a reminder
  when due.
- Table 7 automation cannot determine freshness under the BLS 403. A CPI/Table
  7 period mismatch now reminds the owner to check and supply the official
  workbook without labeling the manual requirement as failure.
- Daily S&P 500 is appropriate only for an end-of-day briefing. It cannot promise
  same-day before the daily workflow, delayed intraday, or real-time values.

### Freshness and visibility gaps

- The release-aware registry and evaluator now encode domestic source contracts
  and distinguish “not released,” “provider lag,” and “repository stale” when
  the caller supplies the corresponding evidence. The scheduled workflow does
  not yet persist or alert on this structured output.
- The UI now supplements observation periods with a restrained exception notice
  when the public freshness manifest identifies provider delay, manual/unknown
  status, unexpected staleness, or failure. Healthy data remain uncluttered.
- Actionable workflow and exhausted-retry failures create a deduplicated GitHub
  owner issue and later record recovery. Table 7 manual need and periodic
  irregular-source review remain separate reminder work.
- Global deployment metadata can appear recent because one daily series updated
  even when another visible series is stale.
- The August 19 failure showed that tests contained hard-coded current display
  values. Story 94 repaired the incident and established the repository testing
  rule in `AGENTS.md`: normal data advancement is expected, and a failed
  current-value assertion is not evidence that provider data is wrong. When
  refresh retrieval and validation succeed but verification fails, first decide
  whether the assertion encodes a true invariant or mutable production state;
  use a controlled fixture or dataset-derived expectation for the latter while
  preserving corruption and transformation checks.
- HOAM, BEA distributional saving, and Federal Reserve research tables have
  schedules too irregular for a simple age threshold.
- Licensed FRED market data (`SP500`, `BAMLH0A0HYM2`) are operationally fragile
  for long-history or real-time ambitions. Current committed-use contracts are
  narrower and valid.

## S&P 500 decision record

The current `SP500` series is the official S&P Dow Jones daily closing index as
redistributed by FRED, with about ten years available under its license. A daily
09:17 UTC check usually captures the prior U.S. market close after FRED
propagation. The tile can therefore lag the live market throughout the trading
day and occasionally by another business day. That is acceptable for the
current descriptive, delayed dashboard if the displayed date remains explicit.

Same-day delayed-intraday or real-time data would be a different product and
architecture. It would require an explicitly licensed redistribution source,
market-calendar and market-hours logic, API credentials and rate limits,
server-side retrieval/caching (not a browser secret), outage and stale-quote
states, after-hours semantics, historical backfill rights, and a cost decision.
No provider change is justified by this audit alone.

## Recommended follow-up stories

1. **Evaluate S&P 500 product requirements.** Decide whether prior-close data is
   sufficient. Only if the owner requires more current data should a separate
   licensing, provider, server-side caching, market-hours, and failure-state
   story proceed.
2. **Tune schedules only from evidence.** Consider less frequent checks for
   annual/irregular sources or provider-calendar dispatches after health
   telemetry exists; keep the current cron unchanged in this story.

## Authoritative schedule and operations references

- [BLS 2026 release calendar](https://www.bls.gov/schedule/2026/home.htm)
- [BLS JOLTS release schedule](https://www.bls.gov/schedule/news_release/jolts.htm)
- [BLS productivity release/revision schedule](https://www.bls.gov/productivity/schedule-releases.htm)
- [BEA release schedule](https://www.bea.gov/news/schedule)
- [Census Survey of Construction schedule](https://www.census.gov/construction/soc/schedule.html)
- [Federal Reserve G.17 releases](https://www.federalreserve.gov/releases/g17/)
- [Freddie Mac PMMS](https://www.freddiemac.com/pmms)
- [Atlanta Fed HOAM](https://www.atlantafed.org/research-and-data/data/home-ownership-affordability-monitor)
- [Treasury daily rate methodology and data](https://home.treasury.gov/policy-issues/financing-the-government/interest-rate-statistics)
- [FRED S&P 500 series notes](https://fred.stlouisfed.org/series/SP500)
- [OECD comparison source registry](international-comparison-registry.md)
- [Repository refresh workflow](../.github/workflows/refresh-and-deploy.yml)
