# Epic: Streamlined Economic Dashboard (`/dashboard`)

## Summary

A single-screen dashboard showing 11 tiles covering the current state of the US economy, rates, and markets. Unlike the existing 20-card page, this is not a question-and-answer format — it is a glanceable status board. No help text on the face of the tile, no per-card narrative. All data sourced from the FRED API.

## Motivation

The existing dashboard answers 20 discrete questions well, but answering a question is a different job from checking a status. When the goal is "what is the state of things right now," 20 cards is too much surface area to scan and the question-framing adds reading overhead to every tile.

This page optimizes for a five-second read: every tile has one hero number, one direction indicator, and one small chart. Interpretation moves to hover/tooltip. The tile set is deliberately capped — if a twelfth tile seems necessary, something should come off first.

## Non-goals

- No interactivity beyond hover tooltips and a hover chart. No date-range pickers, no series toggles, no drill-down.
- No forecasting or commentary. The page reports; it does not opine.
- No reuse of the existing card framework. This page is built fresh and shares nothing but the data layer, if that.
- No international comparison. US only.

---

## Tile specification

Each tile renders: hero number, period-over-period direction, sparkline, "as of" date, and next-release date. Secondary values render as a smaller second line.

### Row 1 — Growth and labor

**1. Real GDP growth**

Hero: quarterly percent change, annualized. Secondary: nominal GDP level.

*Why:* the rate is the signal; the level is trivia. Growth rate is the single most-cited summary of economic performance.

Series: `A191RL1Q225SBEA` (real GDP, % change from preceding period, SAAR). Level from `GDP`.

*Note:* each quarter gets an advance, second, and third estimate roughly a month apart. Label which vintage is showing — revisions of 0.5pp or more are common.

**2. Unemployment rate**

Hero: `UNRATE`. Secondary: monthly change in nonfarm payrolls.

*Why:* the most recognized labor number, though it lags. Payrolls turn earlier, which is why they ride along.

Series: `UNRATE`, `PAYEMS` (request with `units=chg` to get the monthly delta directly rather than differencing the level).

**3. Initial jobless claims**

Hero: 4-week moving average. Secondary: latest weekly figure.

*Why:* weekly, so it is the freshest labor signal on the page by a wide margin — everything else here is monthly or quarterly. Lead with the moving average because the weekly print is noisy around holidays.

Series: `IC4WSA`, `ICSA`.

**4. Sahm Rule gap**

Hero: current value with a state label — "0.23 — below trigger" / "0.57 — triggered."

*Why:* the most current recession-state indicator available. It fires on real-time labor deterioration rather than on a market signal with a variable lead.

Series: `SAHMREALTIME`. Use the real-time variant, not `SAHMCURRENT` — the latter is recomputed against revised unemployment data and will not match what was knowable at the time.

*Note:* trigger threshold is 0.50. Draw that line on the chart. Tooltip should say this is a recession *indicator*, not a forecast — it historically fires shortly after a recession has already begun.

### Row 2 — Prices and rates

**5. Inflation (CPI)**

Hero: CPI year-over-year. Secondary: core CPI year-over-year.

*Why:* headline is what actually affects the wallet; core is what predicts where headline goes next.

Series: `CPIAUCSL`, `CPILFESL`, both requested with `units=pc1` so FRED returns the year-over-year percent change directly.

**6. Expected inflation**

Hero: 10-year breakeven rate.

*Why:* the market's forecast of average inflation over the next decade, sitting directly beside realized inflation in tile 5. The pairing — what happened versus what is priced — is the most informative adjacency on the page.

Series: `T10YIE`.

**7. Fed funds rate**

Hero: effective rate. Secondary: target range upper bound.

*Why:* the anchor everything else on this page prices off.

Series: `DFF`, `DFEDTARU`.

**8. Yield curve**

Hero: 10y − 2y spread in basis points, with a state word: "Inverted by 42 bps" / "Normal, +58 bps." Secondary: 10y − 3m.

*Why:* the best-known recession signal in markets. 10y−2y is the version people recognize; 10y−3m has the stronger historical record and underpins the NY Fed's recession-probability model, so it earns the secondary slot.

Series: `T10Y2Y`, `T10Y3M` — both pre-computed by FRED, no subtraction needed.

*Note:* zero line on the chart, always. Tooltip should carry the caveat that inversion leads recession by 12–24 months, and that historically the un-inversion has landed closer to the recession than the inversion did.

### Row 3 — Markets and credit

**9. Long rates and mortgages**

Hero: 10-year Treasury yield. Secondary: 30-year fixed mortgage rate, plus the spread between them.

*Why:* the 10-year is the bond market's benchmark; the mortgage rate is the household-facing consequence. They are related but not redundant — the spread widens under stress, so showing both plus the gap is more informative than either alone.

Series: `DGS10`, `MORTGAGE30US`.

*Note:* mortgage data is weekly (Thursday), Treasury is daily. Timestamp them separately.

**10. S&P 500** *(double-width tile)*

Hero: percent drawdown from all-time high. Secondary: index level, year-to-date percent change.

*Why:* "−4.2% from high" carries information; "6,340" does not. Drawdown is the framing that answers whether something is wrong.

Series: `SP500`.

*Note:* FRED only retains 10 years of this series. Either compute the peak against a longer history from another source, or label the tile "from 10-year high" and be honest about it.

**11. High-yield credit spread**

Hero: ICE BofA US High Yield OAS, in basis points.

*Why:* the single best stress gauge on the page. Credit widens before equities crack, and unlike VIX it reflects an economic judgment about default risk rather than short-term hedging demand.

Series: `BAMLH0A0HYM2`.

---

## Design

### Direction

Modern, sleek, quiet. The page should feel like a well-made instrument: precise, unfussy, nothing decorative. This is a minimal direction, which means it lives or dies on precision — spacing, alignment, and numeral rendering carry the entire aesthetic, because there is nothing else to look at.

### The signature: color means something crossed a line

The page is neutral by default. A tile takes on color in exactly one circumstance: its value has crossed a defined threshold — in either direction.

Three states:

| State | Meaning | Color |
|---|---|---|
| **Notable-good** | Crossed a line in the favorable direction. Not merely fine — genuinely strong. | Emerald |
| **Normal** | Between the lines. Most tiles, most days. | Neutral |
| **Notable-bad** | Crossed a line in the unfavorable direction. | Amber |

Color applies to the hero number and the chart stroke, and nowhere else on the tile.

Three consequences worth stating plainly:

- **Color is information, not decoration.** A glance answers "is anything happening" before a single number is read. The neutral state is the resting state, and it should dominate.
- **Green means notable, never "fine."** This is the difference between this scheme and a traffic-light dashboard. If green meant "healthy," six tiles would be green on an ordinary day and the page would become a wash — color would signal "everything is normal," which is the least useful thing color can say. The green thresholds are set tight enough that green is uncommon.
- **Direction arrows stay neutral in all cases.** Several tiles have clear valence, but direction still isn't valence: unemployment ticking up from 3.8% and inflation ticking up from 1.2% are not the same event, and neither is a mortgage rate moving at all. State is computed from the value against its thresholds, not from the direction of travel. Arrows are glyphs in `text-muted`.

**Tiles with no valence.** Fed funds and the 10y/mortgage tile are permanently neutral. There is no good or bad level for a policy rate, and a mortgage rate is bad if you're buying and good if you're saving. This is deliberate, not an unfinished threshold — those two tiles report, they do not judge.

### Color tokens

Two text grays, a hairline border, a surface, a canvas, and two state colors. That is the whole palette in each theme.

**Light**

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#F7F7F8` | Page background |
| `surface` | `#FFFFFF` | Tile background |
| `border` | `#E4E4E7` | 1px tile border, chart reference lines |
| `text` | `#18181B` | Hero numbers, primary values |
| `text-muted` | `#71717A` | Labels, secondary values, meta, arrows, chart stroke |
| `state-good` | `#047857` | Notable-good hero and chart stroke |
| `state-bad` | `#B45309` | Notable-bad hero and chart stroke |

**Dark**

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#0A0A0B` | Page background |
| `surface` | `#141416` | Tile background |
| `border` | `#26262A` | 1px tile border, chart reference lines |
| `text` | `#FAFAFA` | Hero numbers, primary values |
| `text-muted` | `#8A8A93` | Labels, secondary values, meta, arrows, chart stroke |
| `state-good` | `#34D399` | Notable-good hero and chart stroke |
| `state-bad` | `#F5A524` | Notable-bad hero and chart stroke |

**Amber rather than red for the bad state.** Red implies "broken," and an inverted curve or a triggered Sahm gap is a condition to notice, not a failure. Amber reads as attention without alarm, and it holds contrast on both a white and a near-black surface, which red does not manage as gracefully.

**Emerald rather than yellow-green for the good state.** Yellow-green sits adjacent to amber on the wheel, so at a glance across a grid the two read as variants of one another rather than as opposites — and under red-green color deficiency they are close to indistinguishable. Emerald separates from amber on both hue and lightness, so the pair survives desaturation. If yellow-green is wanted anyway, `#4D7C0F` light / `#A3E635` dark are the equivalents, with that caveat attached.

Redundant encoding covers the remaining gap: every colored tile also carries a state word in its hero or secondary line, so color is never the only channel carrying the signal.

No third color. If an "extreme" tier is ever wanted above notable-bad, express it with weight or a state word rather than a new hue.

### Typography

**One family: Geist.** Chosen for its numerals — this page is roughly 80% numbers, and Geist's figures are tight, even, and unambiguous at both 44px and 12px, with genuine tabular support. Inter is the conservative substitute if Geist is inconvenient to host; it is more common and slightly more generic, but it will not hurt anything.

**Tabular numerals everywhere, no exceptions.** Set `font-variant-numeric: tabular-nums` globally. Proportional figures cause hero numbers to change width as data updates, which makes a live dashboard visibly twitch and destroys column alignment between tiles. This is the single highest-impact typographic decision on the page.

**Two weights:**

| Weight | Use |
|---|---|
| 400 Regular | Everything except the hero |
| 500 Medium | Hero numbers, tile labels |

No semibold, no bold. At 44px, medium is more than enough emphasis, and it reads considerably more refined than bold.

**Three sizes, plus one conditional:**

| Size | Treatment | Use |
|---|---|---|
| 44px | Medium, `-0.02em` tracking | Hero number |
| 15px | Regular, `text-muted` | Secondary value line |
| 12px | Medium, uppercase, `+0.06em` tracking | Tile label |
| 28px | Medium, `-0.01em` | *Conditional:* hero on tiles whose hero is a phrase rather than a figure — the yield curve ("Inverted by 42 bps") and Sahm ("0.57 — triggered") |

Meta text (as-of and next-release dates) uses the 15px size at `text-muted`, not a fourth size. It is already distinguished by color and position; shrinking it further adds a size for no gain.

The 28px conditional exists for a real reason: a phrase hero at 44px either wraps or overflows, and shrinking it per-tile without a defined token is how type scales rot. Two hero sizes, applied by a documented rule, is cleaner than one hero size plus ad-hoc exceptions.

### Tile anatomy

Every tile is the same height and uses the same six vertical zones in the same order:

```
┌──────────────────────────────┐
│ LABEL                    12px│  ← uppercase, tracked, muted
│                              │
│ 3.2%                     44px│  ← hero, medium, state color
│ Core 2.8%                15px│  ← secondary, muted
│                              │
│ ╱╲___╱╲__                    │  ← sparkline, 40px tall
│                              │
│ ──▮▬▬▬▬▬▬──────────────       │  ← range strip, 8px tall
│                              │
│ Jun 2026 · Next Jul 15   15px│  ← meta, muted
└──────────────────────────────┘
```

**Zones are reserved even when empty.** A tile with no secondary value still holds that vertical space. This is what makes the tiles feel like one family rather than eleven similar objects: hero numbers sit on a shared baseline across every row, and the eye can scan horizontally without re-finding the number on each tile.

Other constants, applied identically everywhere:

- **Radius:** 12px. One value, no exceptions.
- **Border:** 1px hairline in `border`. No shadows in either theme — flat surfaces with hairline separation read more modern than elevation, and shadows in dark mode are close to invisible anyway.
- **Padding:** 24px on all sides.
- **Spacing scale:** 4px base — 4, 8, 12, 16, 24, 32. Nothing off-scale.

### Historical range strip

The state colors answer "should I care." The range strip answers a different question — "how unusual is this?" — and the two answers routinely diverge. CPI at 1.6% is near-ideal by valence and quite low by history; both facts are true and one channel cannot carry them.

Rarity is a continuous quantity, so it gets a spatial encoding rather than a color one. Position is the most precisely-read visual channel available; color intensity is among the least. A red-to-green heat gradient would spend the page's entire color budget on the channel least able to carry the value, and would tint every tile all the time — which destroys the meaning of color elsewhere on the page.

**Encoding.** A hairline horizontal track under the sparkline, 8px tall:

- **Track** — 1px in `border`, full tile width.
- **Middle-50 box** — 6px tall, `border-strong`, spanning the centre half of the track.
- **Marker** — 2px × 8px in `text` (or the state color when the tile is in a threshold state).

**The track is percentile space, not value space.** This is the decision that resolves the window problem. If the track were a linear value axis anchored to the historical minimum and maximum, a single outlier would compress everything else against one end — fed funds against 1981, CPI against 1980 — and every tile would read tame regardless of window length. That compression is what makes long histories feel useless, and it is a property of the scale, not of the history.

Rank is immune to it. A value at the 12th percentile sits 12% along the track whether or not 1981 is in the sample. Including the whole record therefore costs nothing in legibility, which is what makes the next decision affordable.

A consequence worth naming: the middle-50 box always spans exactly the centre half of the track. It stops being data and becomes a fixed reference frame — identical on every tile, so the strips are directly comparable across the grid and marker position reads the same way everywhere. This suits the design goal better than a variable box would.

**Window: the full available history of each series.** Not a fixed 30 years — that is impossible anyway, since the series start at wildly different dates (unemployment 1948, mortgages 1971, the 10y−2y spread 1976, breakevens 2003, and the current FRED deliveries for the high-yield spread and S&P 500 retain only shorter recent windows). Windows are inherently ragged, so rather than truncating the long series to match the short ones, use everything each series has and disclose the window on hover.

This is the choice that guards against reading the recent past as the natural range. A percentile computed over 20 years cannot tell you that current conditions are extraordinary by the standards of the full record; one computed over the full record can.

**Window depth varies, and the strip is not equally trustworthy across tiles.** Nothing on the tile face distinguishes a percentile drawn from 75 years from one drawn from 10 — the strips look identical. This is accepted rather than solved: for a single daily user the denominator is learned once, and eleven captions would pay a permanent cost to fix a temporary problem. Hover discloses it.

But the difference is real, and three tiles warrant less confidence:

| Tile | Window begins | Depth |
|---|---|---|
| Unemployment, claims, CPI, GDP, Fed funds | 1948–1959 | 65–75 yrs |
| Mortgage rate | 1971 | 55 yrs |
| Yield curve | 1976 | 50 yrs |
| High-yield spread | 2023 | About 3 yrs in the current FRED delivery |
| 10y breakeven | 2003 | 23 yrs |
| S&P drawdown | 10 yrs (FRED retention) | 10 yrs |

The breakeven series has never left roughly 0.5–3%, so its percentiles describe small absolute moves. The S&P window is the weakest of all — 10 years cannot separate an unusual drawdown from an ordinary one, and it is the strongest argument for sourcing that one series from outside FRED.

Do not encode window depth visually — no faded tracks for shallow series, no width variation. That introduces exactly the kind of per-tile variation the design brief rules out, to convey something the user already knows.

**Record values.** When the current value is the highest or lowest in the entire window, the marker sits flush to the end of the track and gains a small caret. This is the case the whole strip exists for, and it should be visually unmistakable — a marker at the 99th percentile and a marker at an all-time record should not look the same.

**Exclusions.** Two tiles omit the strip entirely, and reserve the vertical space so grid alignment holds:

- **Sahm gap** — the distribution is a spike near zero with a thin tail. Almost every reading lands in the same percentile bucket, so the marker would barely move and would imply precision that isn't there.
- **S&P drawdown** — bounded at zero and sitting there at every new high, which produces the same degenerate distribution at the top end.

Fed funds and the 10y/mortgage tile, by contrast, gain the most from the strip. Those two are permanently neutral under the threshold rules, so the strip is the only interpretive signal they carry — and a mortgage marker against the full record since 1971 is the clearest available answer to whether today's rate is high.

### Hover

The strip carries no text on the tile face. Rarity is secondary information and should not compete with the hero number for attention, so the exact figures appear on hover only.

Hovering a tile reveals a small panel containing: current percentile, window start and end, the window's minimum and maximum with their dates, and the sparkline lookback. Styling matches the tile — same surface, same border, same type scale, 12px and 15px only.

**Hover-only content must have a non-hover path.** Information available only on pointer hover is invisible to keyboard and screen-reader users and unreachable on touch. Three requirements:

- The strip is focusable, and shows the same panel on `:focus-visible`.
- The strip carries an `aria-label` stating the percentile and window in words.
- On touch, tap reveals the panel; tapping elsewhere dismisses it.

### Charts

Sparklines only. No axes, no gridlines, no tick labels, no legends, no fills. 1.5px stroke in `text-muted`, switching to `state-good` or `state-bad` when that tile is in a threshold state.

Reference lines are the exception, drawn only where a specific value carries meaning: zero on the yield curve, 0.50 on the Sahm gap. Dashed 1px in `border`.

Lookback is per-tile, matched to the series cadence, and stated in the tooltip rather than on the tile face:

| Cadence | Window |
|---|---|
| Daily | 1 year |
| Weekly | 2 years |
| Monthly | 5 years |
| Quarterly | 10 years |

Recession shading is deliberately omitted. At 40px tall there is no room for a second visual layer, and it would compete with the state color for attention.

Note that the sparkline lookback and the range strip window are deliberately different. The sparkline shows recent shape at a legible resolution; the strip places today against the entire record. Compressing thirty or seventy years into a 40px sparkline would render it a flat smear, which is why the two need separate windows rather than one shared setting. Both are disclosed on hover so the difference is never a trap.

### Thresholds

The values that drive tile state. These are opinions, not standards — only the Sahm trigger (0.50) and curve inversion (0 bps) are canonical.

| Tile | Notable-good | Notable-bad |
|---|---|---|
| Real GDP growth | > 2.5% | < 0% |
| Unemployment rate | ≤ 4.0% | ≥ 5.0% |
| Initial claims (4wk MA) | < 220k | > 300k |
| Sahm gap | — | ≥ 0.50 |
| CPI YoY | 1.5–2.5% | > 3.5% or < 0.5% |
| 10y breakeven | 1.8–2.5% | > 3.0% or < 1.0% |
| Fed funds | — | — |
| Yield curve (10y−2y) | — | < 0 bps |
| 10y / mortgage | — | — |
| S&P drawdown | > −1% | < −10% |
| HY OAS | < 350 bps | > 500 bps |

Three notes on the shape of this table:

- **CPI and the breakeven are banded, not monotonic.** Both have a target, so both go bad in either direction — 6% and 0% are each worse than 2%. Deflation is arguably the more dangerous tail, which a naive "lower is better" rule would paint green.
- **Sahm and the yield curve have no good state.** Clearing an alarm is not notable; it is just normal. A green Sahm tile would imply the absence of a recession signal is itself good news, which is a category error.
- **The HY spread thresholds are the softest numbers here.** 350/500 bps is a defensible read of calm versus stressed, but unlike the Sahm rule it has no canonical trigger. Worth revisiting against rolling historical percentiles once the page has been in use.

Thresholds live in one config object, not scattered through tile components. They will be tuned.

### Layout

Four columns. Rows of 4 / 4 / 3, with the S&P tile spanning two columns in the last row so the grid resolves cleanly rather than leaving a ragged gap. The extra width also suits a drawdown chart, which reads better wide.

Responsive: 4 columns → 2 → 1. Tile internals do not change across breakpoints; only the grid does.

### Theme switching

Default to `prefers-color-scheme`. Provide a manual override, persisted, positioned as a small control in the page header — not floating, not fixed. Transition colors at 150ms; everything else is instant. Respect `prefers-reduced-motion`.

### Restraint checklist

Before shipping, remove anything that fails these:

- Is any color on screen that is not a threshold state? Remove it.
- Is more than half the grid colored on an ordinary day? The thresholds are too loose — tighten them.
- Is any state shown by color alone, with no accompanying word? Add the word.
- Is any percentile or window figure printed on the tile face? Move it to hover.
- Is anything reachable only by hover, with no focus or touch path? Fix it.
- Is any font size not in the scale? Fix it.
- Is any tile a different height, radius, or padding than its neighbors? Fix it.
- Does any chart have an axis, gridline, or label? Remove it.
- Is any number rendered without tabular figures? Fix it.

---

## Data sourcing

All 18 source series come from the FRED API, but `/dashboard` does **not** contact FRED at page load. It uses the application's existing browser-free architecture: `npm run data:refresh` retrieves full source histories in Node using `FRED_API_KEY`, validates them, and atomically writes committed JSON. The existing scheduled GitHub Actions refresh-and-deploy workflow runs this path daily. The production browser receives neither the key nor FRED API details and remains usable when FRED is unavailable.

Daily series represent the latest observation available at the most recent successful scheduled refresh, not an intraday quote. A later presentation story will show actual observation dates so the different daily, weekly, monthly, and quarterly cadences remain explicit.

The configured inventory is 18 FRED series, not the earlier rough estimate of approximately 15 calls. Three compatible full-history datasets are reused (`UNRATE`, `IC4WSA`, and `ICSA`); the other 15 have explicit committed representations for the provider series, frequency, or FRED transformation required here.

Useful parameters:

- `units=pc1` — year-over-year percent change, computed server-side. Removes the need to store and difference index levels for CPI.
- `units=chg` — period-over-period change. Use for payrolls.
- `sort_order=asc` — used by the offline refresh so complete histories are validated and committed in chronological order.
- Release-calendar lookup and next-release dates remain deferred to the freshness slice.

**Gap handling.** Daily series publish on business days only, and FRED may return `"."` on a date with no value. The refresh preserves those observations as `null`; it never converts them to zero, fills weekends or holidays, interpolates, or carries values forward.

**Staleness display.** The release cadences here span daily to quarterly. Without an explicit as-of date on every tile, a GDP number from ten weeks ago looks exactly as current as this morning's Treasury yield. Every tile carries both an as-of date and a next-release date; tiles past their expected release date get a visual flag.

**One committed full-history source per representation.** The offline refresh requests the full useful history required by later historical-position calculations. A future sparkline will select a recent subset from that committed history. Story 84 does not compute percentile statistics, range strips, record markers, drawdowns, or sparkline windows.

FRED currently retains only about ten years for `SP500`; a future tile cannot honestly call its comparison an all-time drawdown without another approved source. Story 84 preserves the complete history FRED provides and adds no second market-data provider.

**Watch for revisions.** Monthly and quarterly series get revised, so a cached history is not immutable — a monthly refresh is enough to catch this, but the cache must be replaceable rather than append-only.

---

## Delivery slices

Suggested order for breaking this into stories. Each slice leaves the page in a working state.

1. **Data layer — implemented in Story 84.** The existing offline FRED configuration covers all 18 sources, preserves three compatible existing datasets, validates and atomically commits full useful histories, and exposes them through the local asynchronous repository. `FRED_API_KEY` remains refresh-only.
2. **One tile, end to end — implemented in Story 85.** `/dashboard` now contains the CPI vertical slice with real committed headline/core CPI, the complete tile anatomy, exact thresholds, five-year sparkline, full-history percentile strip and accessible details, both themes, and responsive grid foundation. Review and refine this tile before slice 3.
3. **The grid — in progress after Story 86.** `/dashboard` now adds the complete four-tile Growth and labor row—GDP growth, unemployment, initial claims, and the Sahm Rule—before CPI. The remaining six tiles are not implemented. The established grid responds at four, two, and one columns without placeholders.
4. **Threshold states** — the config object, state computation, state colors, state words.
5. **History and range strips** — the second fetch, percentile computation, strip rendering, record markers, the two exclusions.
6. **Hover** — panels, focus handling, touch behaviour, aria labels.
7. **Freshness** — as-of dates, next-release dates via `fred/releases/dates`, stale flags.

Slices 4 and 5 are independently valuable and can swap order. Slice 6 depends on 5. Slice 7 can land any time after 3.

---

## Deferred

- **CFNAI** (`CFNAIMA3`, recession threshold at −0.70) — a reasonable forward-looking activity tile if one is wanted later. Noting here that ISM PMI is *not* available: ISM pulled its series from FRED over licensing. Worth re-verifying before building on either.
- **Core PCE** (`PCEPILFE`) — arguably the better companion to the Fed funds tile, since it is what the Fed actually targets. Deferred because it releases about two weeks after CPI, and freshness wins on a status board.
- **Dollar index** (`DTWEXBGS`) — only earns a slot if foreign-asset exposure becomes relevant.
- **Real wage growth** (average hourly earnings YoY minus CPI YoY) — legible and useful, but requires computing a derived series across two sources. Best candidate for a twelfth tile if one comes off.
- VIX, gold, oil — considered and rejected. VIX is dominated by tile 11, gold carries no macro signal, oil is partly embedded in breakevens already.
