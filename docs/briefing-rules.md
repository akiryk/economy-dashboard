# Briefing interpretation rules

Status: revised through Story 30. The non-default `/briefing` route currently implements Labor only. The LMCI rules below supersede the Story 29 unemployment/payroll-derived Labor model.

## Product boundary and dimensions

The briefing is a thin synthesis of committed research data. Its five cyclical dimensions are Growth and business activity, Inflation and purchasing power, Labor market, Household finances, and Credit and financial conditions. Federal finances and external accounts form a structural backdrop containing budget balance, debt held by the public, trade balance, and tariff burden.

There is permanently no overall economy score, chip, verdict, or weighted composite. The briefing describes the economy, not markets, forecasts, policy effects, or portfolio implications.

## Current Labor rules — Story 30

The Labor headline uses two provider-published Kansas City Fed Labor Market Conditions Indicators:

- LMCI Level of Activity (`FRBKCLMCILA`) determines Labor Market Activity;
- LMCI Momentum (`FRBKCLMCIM`) determines Labor Market Momentum.

Unemployment, the latest monthly payroll change, three-month average payroll change, prime-age employment, and initial claims are expanded supporting evidence only. They never determine or override either headline.

Each raw, unbounded standardized LMCI index is ranked against all finite observations in its own committed history, currently January 1992 through June 2026. Average zero-based rank handles ties; display values are clamped to 0–100. Exact 20, 40, 60, and 80 boundaries enter the upper tier.

| Activity percentile | Label | Momentum percentile | Label |
|---|---|---|---|
| 0 to <20 | Well Below Avg. | 0 to <20 | Weakening Sharply |
| 20 to <40 | Below Avg. | 20 to <40 | Weakening |
| 40 to <60 | Near Avg. | 40 to <60 | Steady |
| 60 to <80 | Above Avg. | 60 to <80 | Strengthening |
| 80 to 100 | Well Above Avg. | 80 to 100 | Strengthening Sharply |

Percentiles below 40 use the adverse semantic band, 40 to below 60 neutral, and 60 or above favorable. The activity bar fill equals the percentile and marks the 50th-percentile historical midpoint without presenting it as a target. Momentum maps percentile `p` to `((p - 50) / 50) × 45°`, clamped to −45° through +45°; 50 is horizontal, low percentiles point downward, and high percentiles upward.

The collapsed tile contains only its eyebrow, question, the two labeled visuals, and More. More reveals deterministic interpretation, raw values and dates, methodology, supporting data, source links, and attribution. A missing latest primary value is unavailable rather than carried forward; suppressed stale momentum is never called steady.

The Story 29 Labor-specific role, combination, sparkline, and synthesis sections retained later in this document are historical design records and no longer govern the implemented Labor tile. General percentile, freshness, traceability, and product-boundary rules still apply where they do not conflict with this section.

The research cards remain the evidence layer. Briefing readings must be deterministic, traceable, and reproducible from the same committed observations.

## Indicator roles

Indicator roles are reading-specific.

An indicator may serve as:

- a condition anchor;
- a condition confirmer;
- a direction anchor;
- a direction confirmer;
- supporting evidence;
- deep-dive evidence.

An indicator does not need to determine both condition and direction.

Supporting indicators may qualify synthesis or later trigger reviewed tension rules, but they do not set a dimension reading unless explicitly designated as an anchor or confirmer for that reading.

### Labor roles

| Reading | Anchor | Confirmer | Supporting |
|---|---|---|---|
| Condition | Unemployment-rate level | Prime-age employment-to-population level | Initial claims |
| Direction | Payroll-growth movement | Unemployment-rate movement | Initial claims |

Payroll growth is not used as a Labor condition-level measure. Its absolute level is structurally weak for comparison across decades because the economy and payroll base grow over time. Payroll remains the direction anchor because its recent movement is economically meaningful.

Initial claims remains supporting evidence only in the current Labor slice.

### Other dimensions

The approved roles for Growth, Inflation, Households, Credit, and the backdrop remain provisional until each dimension receives its own vertical-slice review. This Labor amendment must not be mechanically generalized without review.

## Condition

Condition answers:

> Where does this measure currently stand relative to history?

Direction answers:

> How has it recently moved beyond ordinary noise?

They are calculated independently. Direction never changes a condition tier.

### Comparison window

The primary comparison window ends at the latest finite, valid observation and begins 25 years earlier, including that boundary.

When committed history begins later, use all available history and retain the actual comparison start.

Do not:

- interpolate gaps;
- convert missing observations to zero;
- substitute nearby observations for missing exact periods.

Five valid observations are the minimum for a percentile.

### Percentile convention

Percentile rank uses average zero-based rank divided by `n - 1`.

- minimum value ranks at 0;
- maximum value ranks at 100;
- ties share the average of their occupied ranks.

Example:

- value `3` in `[5, 1, 3, 3, 2]` ranks at `62.5`.

Inverse percentiles use linear interpolation on the same rank scale.

Example:

- the 60th percentile of `[0, 10, 20, 30, 40, 50]` is `30`.

### Valence

Each indicator declares one of:

- higher-is-better;
- lower-is-better;
- unvalenced.

Valence is explicit and never inferred from the value.

- higher-is-better retains the raw percentile;
- lower-is-better uses `100 - raw percentile`;
- unvalenced indicators receive no favorable or unfavorable interpretation.

For first-screen copy, historical context must use valence-oriented language.

For unemployment, prefer:

> Unemployment is lower than in roughly three-quarters of the past 25 years.

Do not show raw wording such as:

> 23rd historical percentile

in first-screen synthesis copy.

Raw and oriented percentiles both remain available in the trace.

### Internal condition tiers

| Oriented percentile | Internal tier |
|---|---|
| greater than 80 through 100 | Very favorable |
| greater than 60 through 80 | Favorable |
| 40 through 60 | Typical |
| 20 through less than 40 | Unfavorable |
| 0 through less than 20 | Very unfavorable |

Exact boundaries resolve toward Typical:

- 20 → Unfavorable;
- 40 → Typical;
- 60 → Typical;
- 80 → Favorable.

### Labor display vocabulary

| Internal tier | Visible Labor wording |
|---|---|
| Very favorable | Strong |
| Favorable | Solid |
| Typical | Typical |
| Unfavorable | Soft |
| Very unfavorable | Weak |

Internal tier names and group names are trace-only. Visible copy should use natural economic language.

## Labor condition combination

Labor condition combines:

- unemployment-rate level as anchor;
- prime-age employment-to-population level as confirmer.

Group tiers into:

- favorable side;
- typical;
- unfavorable side.

Rules:

1. same group → shared group;
2. favorable anchor + typical confirmer → favorable;
3. typical anchor + favorable confirmer → typical, with favorable confirmation available in synthesis or trace;
4. unfavorable anchor + typical confirmer → unfavorable;
5. typical anchor + unfavorable confirmer → typical, with adverse confirmation available in synthesis or trace;
6. favorable versus unfavorable → Mixed;
7. inadequate required evidence → Unclear.

There is no numeric weighting or averaging.

Adjacent-group differences do not automatically force Mixed.

Reason codes remain trace-only.

## Direction and noise gate

Recent change uses exact period identity:

- weekly: latest versus 13 weeks earlier;
- monthly: latest versus 6 months earlier;
- quarterly: latest versus 2 quarters earlier.

Nearby observations are never substituted for a missing exact comparison period.

For each eligible historical endpoint in the comparison window:

1. calculate the same exact-period change;
2. take its absolute magnitude;
3. collect all valid historical changes;
4. calculate the 60th percentile of those absolute changes.

At least five historical changes are required.

A current movement must be strictly greater than the gate to count as material.

- equal to gate → Broadly stable;
- below gate → Broadly stable;
- above gate → classify by valence.

For valenced indicators:

- favorable material movement → Improving;
- adverse material movement → Deteriorating.

For unvalenced indicators:

- positive material movement → Rising;
- negative material movement → Falling.

### Labor-only normalizing

Normalizing is enabled only for Labor.

For unemployment movement:

- material rise while unemployment condition remains favorable → Normalizing;
- material rise when condition is typical or unfavorable → Deteriorating;
- material fall → Improving;
- movement below the gate → Broadly stable.

The result preserves the fact that the movement is adverse.

Visible copy must state that unemployment increased. The word `normalizing` must not soften or conceal deterioration.

## Labor direction combination

Labor direction combines:

- payroll-growth movement as anchor;
- unemployment-rate movement as confirmer.

Rules:

| Payroll direction | Unemployment direction | Dimension direction |
|---|---|---|
| Broadly stable | Broadly stable | Broadly stable |
| Improving | Broadly stable | Improving |
| Broadly stable | Improving | Improving |
| Deteriorating | Broadly stable | Deteriorating |
| Broadly stable | Deteriorating | Deteriorating |
| Normalizing | Broadly stable | Normalizing |
| Broadly stable | Normalizing | Normalizing |
| Improving | Improving | Improving |
| Deteriorating | Deteriorating | Deteriorating |
| Normalizing | Normalizing | Normalizing |
| Improving | Deteriorating | Mixed |
| Deteriorating | Improving | Mixed |
| Improving | Normalizing | Mixed |
| Normalizing | Improving | Mixed |
| Deteriorating | Normalizing | Deteriorating |
| Normalizing | Deteriorating | Deteriorating |

Core rule:

> Mixed requires opposing material movements.

Broadly stable plus a material movement resolves to the material movement.

Deteriorating plus Normalizing resolves to Deteriorating, while synthesis should note that one adverse movement began from a still-favorable level.

If either required direction input is inadequate, direction is Unclear.

If either required direction input crosses freshness suppression, direction is No fresh evidence.

There is no averaging of signed changes.

## Mixed, Unclear, and No fresh evidence

These states remain distinct:

- Mixed: adequate evidence points in substantively opposing directions;
- Unclear: evidence is missing, inadequate, or unusable;
- No fresh evidence: evidence is too old to support a current direction reading.

Stable-plus-moving evidence is not Mixed.

Supporting evidence cannot independently create a dimension-level Mixed reading.

## Freshness

Freshness compares calendar-day evidence age with explicit expected cadence.

- age at or below 1.5× cadence → Current;
- above 1.5× and at or below 2× → Stale warning;
- above 2× → No fresh evidence and suppress direction.

Exact boundaries remain less severe.

For a ten-day cadence:

- age 15 → Current;
- age 16 → Stale warning;
- age 20 → Stale warning;
- age 21 → No fresh evidence.

Suppression never repeats an old direction or translates absent data into stability.

Monthly and quarterly economic-series dates identify measured periods, not release dates. Labor freshness therefore ages:

- monthly observations from month-end;
- quarterly observations from quarter-end;
- weekly observations from their exact weekly date.

This remains a cadence proxy until explicit release metadata exists.

## Synthesis rules

Visible synthesis prose must come from a finite, reviewed template set.

First-screen copy must:

- state economic facts;
- use readable dates;
- use valence-oriented historical context;
- distinguish condition from direction;
- name genuine disagreement;
- name adverse movement when using Normalizing;
- remain concise enough for a grid cell.

First-screen copy must not expose:

- raw percentile phrasing;
- internal tier names;
- favorable-side or unfavorable-side group labels;
- reason codes;
- raw ISO dates;
- calculation mechanics;
- generated commentary;
- causal claims;
- forecasts;
- political interpretation.

The sanctioned pattern remains factual:

> X while Y.

Trace terminology belongs only in `Why this label`.

## Compact Labor tile anatomy

The collapsed Labor tile should contain, in order:

1. dimension label;
2. human question;
3. condition and direction;
4. one short synthesis block;
5. one compact visual;
6. freshness;
7. details and research navigation.

The collapsed tile should not visibly include:

- a long chart-summary paragraph;
- a min/latest/max strip;
- raw comparison-window dates;
- detailed interquartile-band explanation;
- percentile mechanics;
- revision mechanics.

Those details remain available in disclosure or accessible text.

## Labor anchor visual

Unemployment remains the Labor anchor visual for the current correction.

The visible chart should be compact and may retain:

- latest marker;
- median;
- interquartile historical band.

The trailing 10-year display window is provisional.

The Labor review must revisit whether the 2020 spike makes the compact sparkline less useful than a historical-position strip or distribution graphic.

No future dimension is required to use a 10-year sparkline.

## 3×2 layout review skeleton

The `/briefing` route may render one real Labor tile inside a 3×2 desktop skeleton with five inert layout placeholders.

Placeholders exist only to evaluate:

- density;
- proportions;
- spacing;
- hierarchy;
- first-screen fit;
- responsive behavior.

They must:

- contain no real economic values;
- contain no condition or direction claims;
- make no repository or network requests;
- expose no interactive controls;
- not be presented as real briefing content to assistive technology.

This skeleton does not count as implementation of the other dimensions.

## Revision disclosure

Payroll estimates are commonly revised.

When the current interpretation materially depends on the newest payroll observations, visible synthesis may include a brief qualification:

> The newest payroll estimate is commonly revised.

Do not claim revision magnitude, likely direction, or vintage history that the repository does not store.

## Traceability

Every visible reading must expose:

- inputs;
- periods;
- comparison window;
- raw percentile;
- oriented percentile;
- thresholds;
- freshness;
- deterministic reason.

The engine and orchestration perform no generated prose, network access, file reads, or browser-side data acquisition.

## Current readiness status

The Story 28 and Story 29 readiness conclusions are superseded by Story 30.

The Labor briefing is:

> Implemented with LMCI primary evidence; visual and data verification complete.

The compact tile uses an outlined percentile bar and bounded crosshair arrow rather than the former unemployment sparkline. Raw LMCI values are standardized and unbounded, the percentile graphics are distributional rather than scores, and latest-vintage history cannot reproduce contemporaneous releases.
