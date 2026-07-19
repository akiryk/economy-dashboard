# Labor briefing vertical-slice review

Review date: July 19, 2026

Data vintage: committed snapshots retrieved July 17, 2026

Decision: **Ready with documented cautions**

## Recommendation

The condition/direction model is useful and behaves credibly across the current endpoint and ten representative historical endpoints. Retain the 25-year percentile framework, 60th-percentile direction gate, two-primary agreement rule, and Labor-only `normalizing` state without threshold changes.

The framework is ready for the next vertical slice with two cautions. Payroll growth is a flow whose distribution reflects population scale, business-cycle shocks, and revisions, so it frequently disagrees with unemployment; the product must keep that disagreement conspicuous. Freshness now uses the end of an economic observation period as a cadence proxy, not an actual release timestamp. Later dimensions with long or irregular lags may need explicit release metadata.

This review uses latest-vintage observations. Historical results are descriptive backtests, not real-time forecasts or reconstructions of what a reader would have seen at each date.

## Current committed-data result

- Condition: **Mixed**.
- Direction: **Mixed**.
- Template: `mixed-condition`.
- Sentence: “Unemployment is 4.2% (23rd historical percentile) while payroll growth averages +111K. The primary condition signals disagree (favorable-side versus unfavorable-side), so condition is mixed; direction also disagrees (broadly-stable versus improving) and is mixed. The newest payroll estimate is commonly revised.”
- Freshness: both monthly primaries are current as of July 19 when age is measured from the end of June; neither direction is suppressed.
- Payroll revision qualifier: active because the latest payroll endpoint contributes to a gate-passing change.

| Measure | Latest | 25-year raw / oriented percentile | Tier and group | Six-month change | 60th-percentile gate | Result |
|---|---|---:|---|---:|---:|---|
| Unemployment | 4.2%, June 2026 | 22.74 / 77.26 | Favorable; favorable side | −0.2 percentage points | 0.3 | Gate not passed; broadly stable |
| Payroll three-month average | +111K, June 2026 | 35.17 / 35.17 | Unfavorable; unfavorable side | +150K | 93.4K | Gate passed; improving |

The comparison window is June 2001 through June 2026. Unemployment uses lower-is-better valence; payroll growth uses higher-is-better valence. Values agree with the committed unemployment and derived payroll-growth datasets and their research cards. Signed changes use exact December 2025 endpoints: unemployment 4.4% and payroll growth −39K after display rounding.

Full-history ranks provide the secondary context: unemployment is raw 21.60 and oriented 78.40; payroll growth is 37.28 on both scales. These are close to the 25-year classifications and create no material current divergence.

### Supporting evidence

| Measure | Latest | 25-year condition | Recent direction | Finding |
|---|---|---|---|---|
| Prime-age employment-to-population | 80.2%, June 2026 | Very favorable; raw 82.78 | Deteriorating: −0.5 points exceeds its 0.4 gate | Meaningful current tension for the later conflict story |
| Initial claims, official four-week average | 214K, week of July 11, 2026 | Very favorable after lower-is-better orientation; raw 9.39 | Broadly stable: +4.25K does not exceed its 17K gate | Timely confirmation |

The supporting values, period labels, valence, six-month/13-week windows, and research links agree with their source cards. Removing either supporting series leaves both primary readings unchanged.

## Historical episode review

Each fixture truncates the committed latest-vintage series at the endpoint. Expected states are pinned in `laborBriefingHistoricalReview.test.ts`.

| Endpoint | Episode | Condition | Direction | Primary evidence and finding |
|---|---|---|---|---|
| Dec. 1999 | Strong, stable expansion | Strong | Broadly stable | Unemployment 4.0% and payrolls +337K are very favorable; changes remain below 0.4 and 88.5 gates. |
| Nov. 2001 | Downturn and normalization transition | Mixed | Mixed | Unemployment 5.5% remains favorable but rises 1.2 points beyond a 0.4 gate (`normalizing`); payrolls −292K are very unfavorable and deteriorating. |
| Dec. 2007 | Early deterioration | Mixed | Mixed | Unemployment 5.0% is favorable but +0.4 clears the 0.3 gate; payrolls +99K are unfavorable but stable. |
| Oct. 2009 | Clearly weak market | Weak | Mixed | Unemployment 10.0% is deteriorating while payrolls −200K improve sharply from a worse level. |
| Dec. 2010 | Early recovery | Mixed | Broadly stable | Unemployment 9.3% remains very unfavorable while payrolls +163K are typical; neither change clears its gate. |
| Dec. 2019 | Strong stock, softer flow | Mixed | Broadly stable | Unemployment 3.6% is very favorable while payrolls +143K rank unfavorable, demonstrating the structural-scale caution. |
| Apr. 2020 | Extreme shock | Weak | Deteriorating | Unemployment 14.8% and payrolls −7.2M are very unfavorable and deteriorating. |
| Dec. 2021 | Improving recovery | Strong | Improving | Unemployment 3.9% and payrolls +682K are very favorable and improve beyond their gates. |
| Aug. 2024 | Stronger stock, cooling flow | Mixed | Mixed | Unemployment 4.2% remains favorable and stable; payrolls +50K are unfavorable and deteriorating. |
| Jun. 2026 | Current economic endpoint | Mixed | Mixed | Unemployment is favorable and stable while payroll condition is unfavorable but improving. |

The gate suppresses ordinary wiggle in 1999, 2010, and unemployment in 2024/2026; detects adverse movement in 2001, 2007, and 2020; and detects recovery in 2009 and 2021. No evidence supports changing the 60th percentile or six-month window. A slow recovery can remain broadly stable, as in 2010; that is acceptable because direction asks whether movement is unusually large, not merely nonzero.

## Findings and decisions

### Condition and historical context

- Independent calculations and tests confirm average-rank percentiles, tie handling, valence reversal, tier boundaries, and group agreement.
- `Mixed` appears whenever the primary tier groups differ; no averaging or supporting signal changes it.
- Current full-history ranks are close to the 25-year ranks, so the present classification is not a window artifact.
- Payroll growth has structural comparability limits. This is a caution, not grounds to override the approved inventory here.
- Defect corrected: the trace now exposes full-history raw and oriented ranks for both primaries.

### Direction and `normalizing`

- Exact periods, signed/absolute changes, historical changes, strict gate comparison, and missing-period behavior match the rules.
- The per-indicator gate behaves sensibly across different units.
- The 2001 and 2007 endpoints validate `normalizing`: unemployment moves adversely beyond noise while its level remains favorable. At typical or unfavorable condition, adverse movement becomes deteriorating.
- Retain `normalizing` for Labor only. It is not a forecast.
- Copy now names the affected primary, magnitude, six-month window, adverse character, and non-forecast status instead of saying only “unemployment or payroll.”

### Mixed, unclear, and freshness states

- Mixed remains adequate conflicting evidence; missing primary, inadequate history, and missing exact comparison fixtures remain unclear.
- Missing supporting evidence does not suppress a valid primary result.
- No-fresh suppression replaces direction rather than repeating an old state. Exact 1.5× and 2× boundaries remain less severe.
- Defect corrected: monthly freshness aged from the first day of the economic month, falsely flagging June data stale on July 19. Labor now ages monthly evidence from month-end; June primaries are 19 days old and current. Weekly claims retain their exact date.
- Conflicting copy has priority over stale-warning copy while the visible stale marker remains; no-fresh suppression still selects the no-fresh template.

### Templates and revisions

- All ten finite states were reviewed. Tests require both values, conflict wording, adverse normalizing wording, no causal/predictive language, and conditional revision text.
- Defect corrected: simultaneous mixed condition and direction named only condition. It now names both conflicts and states.
- Defect corrected: the generic valid template was vague during the 2020 shock. It now states primary condition groups and directions.
- Payroll revision language remains “commonly revised,” makes no magnitude or direction claim, and appears only for gate-passing payroll movement.

### Sparkline, accessibility, and layout

- Current calculations reconcile to 121 monthly observations from June 2016 through June 2026; minimum 3.4%, maximum 14.8%, latest 4.2%, comparison median 5.1%, and interquartile band 4.3%–6.4%.
- Visible and accessible text identifies the band as a historical distribution, not a confidence interval. Essential values require no hover or color interpretation.
- Headless Chrome review at 1440 pixels and the mobile breakpoint confirmed hierarchy, legibility, wrapping, and no horizontal scrolling at the reliable 500-pixel headless viewport. Component tests cover keyboard-operable native disclosures.
- Layout correction: briefing grid items can shrink, synthesis text wraps, and readings flex at narrow widths.
- The 2020 spike compresses ordinary recent variation. That is an honest consequence of a fixed 10-year scale and is accepted.

### Supporting indicators

- Both supporting series are subordinate and cannot change a chip.
- Prime-age employment currently supplies meaningful tension: favorable level with material deterioration. The later conflict story should test whether the approved two-bar rule surfaces it.
- Claims confirm low stress and stable direction. Weekly semantics and four-week-average units are preserved.

## Decision register

### Defects corrected

1. Monthly freshness used period start and generated a false warning; use period end for monthly and quarterly economic periods in Labor orchestration.
2. Simultaneous condition/direction conflict copy omitted one conflict; name both.
3. Full-history secondary percentile was absent; expose raw and oriented ranks.
4. Generic synthesis fallback did not state condition/direction; make it explicit.
5. Normalizing copy did not identify the adverse primary movement; name it and its magnitude.
6. Narrow layout retained avoidable min-content pressure; permit content to shrink and wrap.

### Retained decisions

- 25-year primary window and five tiers; exact boundaries toward typical.
- Six-month monthly and 13-week weekly direction windows.
- Per-indicator 60th-percentile absolute-change gate.
- Two-primary agree-or-mixed combination without weighting.
- Labor-only `normalizing`; supporting evidence cannot determine readings.
- Finite templates and latest-vintage revision disclosure.

### Acceptable limitations

- Latest-vintage history cannot reproduce contemporaneous estimates or quantify revisions.
- Payroll-level percentiles have structural comparability limits.
- Period-end freshness is a cadence proxy, not a release-date calculation.
- The fixed sparkline is visually dominated by the 2020 shock.

### Deferred enhancements

- Explicit release-date metadata if later dimensions require it.
- Supporting tension lines, including the current prime-age employment tension.
- Comparable episodes, recession dating, cross-dimension tensions, and the full grid.

No other dimension was implemented, and no threshold changed to obtain a preferred current label.
