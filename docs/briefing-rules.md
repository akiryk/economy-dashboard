# Briefing interpretation rules

Status: implemented and reviewed through the Story 28 Labor vertical slice. The non-default `/briefing` route uses these rules for Labor; other dimensions remain unimplemented.

## Product boundary and dimensions

The future briefing is a thin synthesis of committed research data. Its five cyclical dimensions are Growth and business activity, Inflation and purchasing power, Labor market, Household finances, and Credit and financial conditions. Federal finances and external accounts form a structural backdrop containing budget balance, debt held by the public, trade balance, and tariff burden. The backdrop receives historical-position context, not cyclical verdicts.

There is permanently no overall economy score, chip, verdict, or weighted composite. The briefing describes the economy, not markets, forecasts, policy effects, or portfolio implications.

## Indicator roles

Primary indicators alone determine dimension readings. Supporting indicators may later qualify a synthesis or trigger a reviewed tension rule, but cannot flip a reading. Deep-dive cards remain research evidence only.

| Dimension | Primary | Supporting | Deep-dive |
|---|---|---|---|
| Growth | Real GDP growth; real business investment growth | GDP per capita growth; productivity momentum; housing starts; profit share; capacity utilization | Productivity level; manufacturing output vs employment |
| Inflation | Headline vs core CPI; real wage growth | Standalone headline CPI; inflation momentum | — |
| Labor | Unemployment; payroll growth | Prime-age employment-to-population; initial claims | — |
| Households | Income vs spending per person; debt-service ratio | Saving rate; home-ownership cost share | — |
| Credit | NFCI credit subindex; SLOOS C&I standards | Fed funds vs 10-year Treasury | — |
| Backdrop | — | Budget balance; public debt; trade balance; tariff burden | — |

The ten primaries are exactly two per cyclical dimension. Each indicator's reviewed configuration declares `higher-is-better`, `lower-is-better`, or `unvalenced`; meaning is never inferred from the value. Saving, profit share, capacity utilization, rate levels, budget balance, public debt, trade balance, and tariff burden are unvalenced in v1.

## Condition

Condition answers where the latest level stands relative to history. Direction answers how it has recently moved beyond ordinary noise. They are calculated independently; direction never changes a condition tier.

The comparison window ends at the latest finite, valid observation and begins 25 years earlier, including that boundary. If committed history begins later, all available history is used and the actual start is retained. Gaps remain gaps: the engine neither interpolates nor converts missing values to zero. Five valid observations are the minimum for a percentile.

Percentile rank uses average zero-based rank divided by `n - 1`. The minimum and maximum rank at 0 and 100; ties share the average of their occupied ranks. For example, value 3 in `[5, 1, 3, 3, 2]` ranks at 62.5. The inverse percentile uses linear interpolation on that rank scale; the 60th percentile of `[0, 10, 20, 30, 40, 50]` is 30.

Valence converts raw rank into meaning: higher-is-better retains it, lower-is-better uses `100 - raw`, and unvalenced has no oriented rank or favorable verdict. For example, raw 75 stays 75 for higher-is-better and becomes 25 for lower-is-better. Unvalenced results are only `high`, `typical`, or `low`, with 40 and 60 included in typical.

| Oriented percentile | Internal tier |
|---|---|
| greater than 80 through 100 | Very favorable |
| greater than 60 through 80 | Favorable |
| 40 through 60 | Typical |
| 20 through less than 40 | Unfavorable |
| 0 through less than 20 | Very unfavorable |

Thus exact 20 is unfavorable, 40 and 60 are typical, and 80 is favorable: every boundary resolves toward typical. Visible dimension wording and the inflation deflation guard belong to later UI stories.

The Labor vertical slice maps very favorable to `strong`, favorable to `solid`, typical to `typical`, unfavorable to `soft`, and very unfavorable to `weak`. At dimension level, two primary tiers on the favorable side display `solid` and two on the unfavorable side display `soft`; the more emphatic `strong` and `weak` labels remain available for indicator-level and later reviewed presentation. Primary disagreement displays `mixed`, and inadequate evidence displays `unclear`.

## Direction and noise gate

Recent change uses exact period identity: latest versus 13 weeks earlier for weekly data, 6 months earlier for monthly data, and 2 quarters earlier for quarterly data. For example, monthly movement from 1 on January 1 to 4 on July 1 is +3. If January 1 is absent, a nearby observation is not substituted.

For each eligible endpoint in the comparison window, the engine calculates the same exact-period change and collects its absolute magnitude. Missing comparison periods are skipped. At least five historical changes are required. The initial gate is their linearly interpolated 60th percentile. Current movement must be strictly greater than the gate to be material; equality is broadly stable. For example, zero current movement against a zero gate remains broadly stable.

When material, favorable movement is `improving` and adverse movement is `deteriorating`. For unvalenced data, positive movement is `rising` and negative movement is `falling`. Movement that does not clear the gate is `broadly-stable`. Results retain signed and absolute change, threshold, eligible history count, gate result, and comparison dates.

### Labor-only normalizing

`Normalizing` is enabled only by Labor configuration. It requires an adverse, gate-clearing movement in a valenced indicator whose current condition remains favorable or very favorable. The result preserves `adverse` as the underlying orientation. For example, a materially rising lower-is-better Labor measure with favorable condition is normalizing; at typical condition the same movement is deteriorating. Favorable movement remains improving. No other dimension can enable this state in v1.

## Freshness and evidence

Freshness compares calendar-day evidence age with explicit expected cadence. Age at or below 1.5 times cadence is `current`; above 1.5 and at or below 2 times is `stale-warning`; above 2 times is `no-fresh-evidence` and suppresses direction. Exact boundaries remain less severe. For a ten-day cadence, age 15 is current, 16 warns, 20 warns, and 21 suppresses. Suppression never repeats an old direction or calls absent news stable. Seven-day new markers and page refresh UI are later work.

Economic-series monthly and quarterly dates identify the first day of a measured period, not a release date. Labor freshness therefore measures monthly age from the final calendar day of the observation month (and quarterly age from quarter-end); weekly series retain their exact weekly date. This avoids treating a completed monthly period as already one month old on its represented date. It remains a cadence proxy until explicit release dates exist.

## Combining two primaries

Condition tiers group into favorable side, typical, and unfavorable side. Matching primary groups produce the shared group. Favorable plus typical, or favorable plus unfavorable, is `mixed`. Missing or inadequate primary evidence is `unclear`. There is no averaging, weighting, winner, or supporting input.

Direction agrees only when both primary states match exactly. Different adequate states are `mixed`; normalizing versus deteriorating therefore remains mixed. Inadequate primary direction is `unclear`. If either primary crosses freshness suppression, the dimension is `no-fresh-evidence`. Every result retains both inputs and a reason code.

`Mixed` means adequate evidence conflicts. `Unclear` means evidence cannot support a reading. `No fresh evidence` is age-driven. These meanings never collapse into one label.

## Synthesis and traceability

Future prose must come from a finite, reviewed template set keyed by analytical state. Generated commentary, causal claims, and one-off editorial interpretations are prohibited. Every visible reading must expose its inputs, dates, window, percentile, thresholds, and deterministic reason.

The engine accepts observations and configuration and performs no repository access, file reads, network calls, React rendering, browser work, prose generation, styling, or chart configuration.

## Provisional parameters

Story 28 retained the Labor tier thresholds, 60th-percentile gate, direction windows, freshness multipliers, and Labor-only scope for normalizing. Growth and Household vocabulary and any use of normalizing outside Labor remain unapproved. The no-score, separate-reading, conflict, and template-only architecture is permanent.

Every worked example above is pinned by a test named `docs example` in `src/features/briefing/briefingRules.test.ts`.

## Labor vertical-slice review note

The `/briefing` route applies these rules to committed Labor data without tuning thresholds to obtain a preferred label. Payroll direction that clears the material-movement gate receives the standing sentence qualification that the newest payroll estimate is commonly revised. Story 28 retained the analytical parameters and requires full-history secondary ranks in the primary trace and copy that names every simultaneous primary conflict. See [`labor-briefing-review.md`](labor-briefing-review.md).
