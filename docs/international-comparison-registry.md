# International comparison registry

This registry is the research gate for Epic 92. It audits every card currently
shown on the research dashboard and records whether its concept has a defensible
Version 1 international comparison. International modules use one harmonized
OECD source for the United States and peers; existing U.S. cards keep their
current domestic sources and definitions.

## Peer-country rule

The fixed Version 1 group is the intersection of OECD membership, the IMF April
2026 WEO advanced-economy classification, and population of roughly 25 million
or more: Australia, Canada, France, Germany, Italy, Japan, South Korea, Spain,
the United Kingdom, and the United States. OECD historical population data
(`OECD.ELS.SAE,DSD_POPULATION@DF_POP_HIST,1.0`, measure `POP`, persons) confirms
that each had at least 27.6 million people in its latest 2024/2025 observation.
The IMF classifies the G7, euro-area members France/Germany/Italy/Spain, Australia,
and Korea as advanced economies, and all ten are among the OECD's 38 members.

This list is stable product methodology, not a live monthly filter. ISO alpha-3
codes are `AUS`, `CAN`, `FRA`, `DEU`, `ITA`, `JPN`, `KOR`, `ESP`, `GBR`, and
`USA`. Missing data never changes the peer set.

## Approved Version 1 metrics

All production queries use the official OECD SDMX REST host
`https://sdmx.oecd.org/public/rest/`, request narrow CSV responses, and pin the
verified dataflow version. The latest acceptable observation is selected per
country; monthly data allow three months of staleness and quarterly data allow
two quarters. A module requires valid U.S. data and at least eight valid peers.

| Metric | Dataflow and exact selection | Frequency / adjustment / unit | Transformation and coverage | Decision |
|---|---|---|---|---|
| Prime-age employment | `OECD.SDD.TPS,DSD_LFS@DF_IALFS_EMP_WAP_Q,1.0`; `EMP_WAP`, `_Z`, `Y`, `_T`, `Y25T54`, `_Z`, `Q` | Quarterly; calendar and seasonally adjusted; `PT_WAP_SUB` (percent of same-subgroup working-age population) | OECD-published level. All 10 peers currently valid; lag 0–1 quarter. | Include; reference module. |
| Unemployment | `OECD.SDD.TPS,DSD_LFS@DF_IALFS_UNE_M,1.0`; `UNE_LF_M`, `PT_LF_SUB`, `_Z`, `Y`, `_T`, `Y_GE15`, `_Z`, `M` | Monthly; calendar and seasonally adjusted; percent of same-subgroup labour force | OECD harmonized unemployment level. All 10 peers valid; the rolling-quarter UK observation keeps its actual period. | Include. |
| Headline inflation | `OECD.SDD.TPS,DSD_G20_PRICES@DF_G20_PRICES,1.0`; monthly all-items CPI/HICP, `PA`, `_T`, `N`, `GY` | Monthly; unadjusted; year-over-year percent | OECD-published 12-month change. The G20 flow explicitly uses national CPI for non-EU peers and HICP for EU members/UK. Nine peers are present; Spain is retained as unavailable. | Include with caveat. |
| Real GDP growth | `OECD.SDD.NAD,DSD_NAMAIN1@DF_QNA_EXPENDITURE_GROWTH_OECD,1.1`; `Q.Y.[peer].S1.S1.B1GQ._Z._Z._Z.PC.L.GY.T0102` | Quarterly; calendar and seasonally adjusted; chain-volume year-over-year percent | Common OECD `GY` transformation of real GDP for every country. All 10 peers valid within two quarters. | Include. |
| Ten-year government yield | `OECD.SDD.STES,DSD_STES@DF_FINMARK,4.0`; `[peer].M.IRLT.PA._Z._Z._Z._Z.N` | Monthly; percent per annum; not seasonally transformed | OECD long-term rate centered on ten-year government bonds. All 10 peers valid. Numeric order is descriptive, not a quality ranking. | Include. |

OECD rate limits mean refreshes use bounded retries and narrow queries. The
committed artifact is last-known-good data: transient failures must not replace
it. Dataflow/query changes, unexpected units, or schema failures are hard
failures. Tests use fixtures rather than live endpoints.

## Current dashboard audit

The home page has 25 cards. “Source” below describes the current U.S. card;
international recommendations apply only to the Compare page.

| Current card / concept | Current U.S. source | International source, frequency, unit, adjustment, lag | Comparability, caveat, fallback, and recommendation |
|---|---|---|---|
| Real GDP growth | BEA `GDPC1` via FRED; quarterly SAAR level, locally derived YoY % | Approved OECD QNA above; quarterly YoY real growth; typically 1 quarter | High; common QNA concept. Include. |
| Real GDP per-capita growth | BEA `A939RX0Q048SBEA` via FRED; quarterly SAAR dollars, derived YoY % | OECD Quarterly GDP per capita; quarterly real/volume growth; 2-quarter window | Concept is defensible, but the exact narrow versioned query and ten-peer coverage are not yet validated. Defer; IMF WEO annual real per-capita growth is a possible fallback. |
| Labour productivity growth | BLS `OPHNFB` via FRED; quarterly SA, derived YoY % | OECD Productivity Statistics, GDP per hour worked; preferably annual growth; 18-month window | High conceptually, but exact current dataflow/coverage remain unverified. Defer rather than substitute a level or per-worker measure. |
| Headline CPI inflation | BLS `CPIAUCNS` via FRED; monthly NSA, derived YoY % | Approved OECD G20 CPI flow above; monthly YoY %; 3-month window | Comparable with explicit CPI/HICP methodology caveat and Spain unavailable. Include with caveat. |
| Recent inflation momentum | BLS `CPIAUCSL`; SA three-month annualized and conditional scenario | No approved direct analog | The bespoke forward conditional/base-effect scenario is not a standard harmonized indicator. Reject. |
| Real wage growth | BLS `CES0500000003` and `CPIAUCSL`; monthly SA exact ratio | OECD average annual wages could support a different annual concept | Worker population, FTE treatment, deflator, and frequency differ. Defer pending a separate methodology decision. |
| Inflation contributions | BLS News Release Table 7 plus BLS CPI category series | OECD contributions to annual inflation; monthly percentage points | Category weights and Australia coverage require separate validation. Defer. |
| Unemployment rate | BLS `UNRATE` via FRED; monthly SA percent | Approved OECD IALFS unemployment above; monthly SA percent; 3-month window | High; harmonized definition for all peers. Include. |
| Prime-age employment ratio | BLS `LNS12300060` via FRED; monthly SA percent | Approved OECD IALFS employment above; quarterly SA percent; 2-quarter window | High; ages 25–54 and same-subgroup population. Include. |
| Payroll growth | BLS `PAYEMS`; establishment payrolls, monthly SA changes/average | None | Institutionally specific; total-employment growth would answer another question. Reject. |
| Job-growth breakeven | BLS payrolls plus Federal Reserve modeled breakeven | None | U.S.-specific demographic/payroll model. Reject. |
| Layoffs and claims | BLS JOLTS plus DOL claims via FRED | None | Insurance systems and separation measures differ institutionally. Reject. |
| Personal saving rate | BEA `PSAVERT`; monthly SA annual-rate percent | OECD household saving indicators | Sector definitions and current card's distributional expansion need exact matching. Defer; no silent substitution. |
| Home-ownership cost share | Atlanta Fed HOAM workbook; modeled monthly percent | OECD house price-to-income index; quarterly index, 2015=100 | Index measures change from a national baseline, not absolute affordability. Reject as a direct analog; a future “change since 2015” module could be separate. |
| Housing starts | Census `HOUST` and population; monthly SA annual rate | No approved direct analog | Dwelling definitions, permitting, and normalization need dedicated research. Defer. |
| Manufacturing output | Federal Reserve `IPGMFNQ`; monthly SA index, derived YoY growth | OECD Industrial Production; monthly index transformed to exact-calendar YoY %; 3-month window | Concept is promising, but exact versioned manufacturing-only query and full coverage are not yet validated. Defer. |
| Business investment growth | BEA `PNFIC1`; quarterly real SAAR level, derived YoY % | OECD QNA gross fixed capital formation | Existing card is private nonresidential investment; general GFCF is materially broader. Reject as a direct analog. |
| Corporate profit share | BEA profits/GDP via FRED; quarterly percent | No approved harmonized matching concept | Accounting, sector, and numerator definitions require separate research. Defer. |
| Federal funds target | Federal Reserve target range via FRED; daily percent | Potential future central-bank policy rates | Policy instruments and operating frameworks differ. Reject as a direct analog. |
| Yield-curve inversion | Treasury 10-year minus 3-month via FRED; monthly spread | No approved common curve-spread module | Short-rate instruments and curve conventions differ. Reject as a direct analog. |
| 30-year mortgage rate | Freddie Mac `MORTGAGE30US`; weekly percent | None | Fixed periods, reset conventions, terms, and borrower mix differ. Reject. |
| Federal budget balance | BEA/FRED federal balance as % GDP; annual | OECD general-government net lending/borrowing; annual % GDP; 18-month window | General government is comparable but not the same as the federal-only card. Defer from Version 1 rather than imply a direct match. |
| Federal debt held by public | Treasury/BEA via FRED; quarterly % GDP | OECD gross general-government debt; annual % GDP; 18-month window | Gross general-government debt is not debt held by the public. Defer from Version 1; any future module must be explicitly reframed. |
| Trade balance | BEA goods/services balance divided by GDP; quarterly % | OECD current-account balance; quarterly/annual % GDP | Current account includes income/transfers and is not the trade balance. Reject as a direct analog. |
| Effective tariff burden | Treasury customs duties / Census goods imports; quarterly % | None | Realized customs burden depends on national tariff/import composition. Reject for Version 1. |

## Freshness and validation policy

- Monthly: at most three months old; quarterly: at most two quarters old;
  annual: at most 18 months old.
- Keep every country's actual period. Never fill missing values with zero or
  rank unavailable/stale observations.
- Require the United States and at least 8 of 10 valid countries.
- Validate fixed country codes, finite values, unique country/period pairs,
  expected dataflow/version, frequency, unit, adjustment/transformation codes,
  monotonically ordered periods, and plausible percentage magnitudes.
- A 429, timeout, or 5xx receives small bounded retry/backoff and preserves the
  committed snapshot on failure. A 4xx/query/schema/semantic failure is reported
  distinctly and must not be hidden by weaker validation.
