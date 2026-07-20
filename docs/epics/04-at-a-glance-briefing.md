# Product-design proposal: the at-a-glance U.S. economic briefing

Status: **v1.1 — final.** Incorporates team-review amendments A–G plus two edge-case guards added in response (tier-boundary tie rule; deflation display guard). The Step 0 decision record in section 12 is the approved baseline for `docs/briefing-rules.md` and the implementation stories.
Inputs: `product-overview.md`, `product-principles.md`, `phase-1-closeout.md`, `phase-1-limitations.md`, repository working rules in `AGENTS.md`, and the product-design brief.
Scope: analytical and product model only. No code, no visual styling decisions beyond conceptual layout.

---

## 1. Executive recommendation

Build the briefing as a thin, fully rule-driven synthesis layer on top of the existing 28 research cards, organized around **five cyclical dimensions plus one structural backdrop panel**, where every dimension reports **condition and direction as two separate readings**, every reading is produced by a documented deterministic rule over committed data, and disagreement among a dimension's primary indicators forces a visible "mixed" state with a sentence that names the conflict rather than an average that hides it.

The five cyclical dimensions are Growth and business activity; Inflation and purchasing power; Labor market; Household finances; and Credit and financial conditions. Fiscal position and trade are real but slow-moving context, so they appear as a compact backdrop panel rather than as tiles competing for first-screen attention.

Each dimension tile leads with its human question, a condition reading, a direction reading, and one template-generated synthesis sentence containing actual values. One anchor sparkline with a historical median band provides visual context. A tension line appears only when the rules detect genuine disagreement. Freshness is always visible, and a stale dimension suppresses its direction reading rather than implying stability.

There is deliberately no overall economic score, no red/green traffic light without a stated rule, and no market or portfolio content. Every label is traceable: the reader can always expand "why this label" and see the rule, the window, the percentile, and the inputs. The research cards remain untouched as the evidence layer, and every tile links directly into them.

The first implementation slice is a single dimension — the labor market — built end to end on a non-default `/briefing` route, reviewed against real data, and only then extended to the remaining dimensions and promoted to the default view.

---

## 2. Proposed top-level briefing dimensions

### Why five cyclical dimensions rather than the current nine sections

The nine Phase 1 sections are organized by *subject matter*, which is right for a research inventory. A briefing should be organized by *distinct ways the economy can go wrong or right*. Two sections belong together when they answer the same underlying question and can plausibly fail together; they belong apart when one can deteriorate while the other stays healthy. Applying that test collapses nine sections into five cyclical dimensions, each of which has an independent failure mode, plus one structural backdrop:

**A. Growth and business activity — "Is the productive economy expanding?"**
Real GDP growth, real GDP per capita, business investment, capacity utilization, housing starts, manufacturing, and productivity momentum all describe whether output and productive capacity are growing. The important economic idea is the aggregate production engine: an economy can have low inflation and low unemployment while output stagnates, and this dimension is where that would show. Housing starts move here from the Housing section because starts are a cyclical activity measure (and one of the most interest-rate-sensitive early movers), while housing *affordability* is a household-finances question — the current Housing section actually contains two different concepts.

**B. Inflation and purchasing power — "Are prices stable, and is pay keeping up?"**
Headline CPI, core CPI, short-run inflation momentum, and real wage growth belong together because inflation matters to a household mainly through purchasing power. Reporting a CPI number without the real-wage comparison invites exactly the headline-metric error the product exists to prevent (inflation "falling" while cumulative price levels still outpace pay, or vice versa). The important idea captured is nominal stability: whether the price system is quietly doing its job or distorting decisions and eroding incomes.

**C. Labor market — "Can people find and keep work?"**
The Kansas City Fed LMCI Activity and Momentum indexes provide the Labor headline pair: activity summarizes the current state and momentum summarizes broad direction across 24 inputs. Unemployment, prime-age employment-to-population, payroll growth, and initial claims remain supporting evidence under More and cannot override the LMCI tiers. Nominal wage growth stays in dimension B because its briefing-level meaning is purchasing power, though the research card is cross-linked from both.

**D. Household finances — "Are household resources, cushions, and obligations sustainable?"**
Real income versus spending per person, saving rate, debt-service ratio, and home-ownership affordability describe whether the household sector is living within its means and how exposed it is to shocks. The important idea is resilience rather than momentum: households can look fine on labor-market measures while running down savings, taking on unaffordable housing costs, or carrying rising required debt payments. This is the dimension most subject to the aggregate-versus-distribution caveat, and its copy carries that qualification permanently.

**E. Credit and financial conditions — "Is financing supporting or restraining the economy?"**
The rate pair, the NFCI credit subindex, and SLOOS lending standards describe whether the financial system is transmitting restraint or ease into the real economy. This deserves separate top-level status because credit tightening is a classic early channel of downturns and can diverge from every contemporaneous real-economy measure. It is deliberately framed as *financing conditions for the economy*, not as market performance — the boundary in section 8 keeps asset prices and valuations out.

**Backdrop panel: Fiscal position and external accounts.**
Federal budget balance, debt held by the public, trade balance, and effective tariff burden are genuinely important, but they are slow-moving, largely structural, mostly unvalenced in the short run, and almost never the thing that changed since the reader's last visit. Giving them full tiles would spend scarce first-screen space on readings that rarely move and would pressure the product into assigning conditions ("is a 6% deficit unfavorable?") that it cannot defend with a simple rule. They therefore appear as a compact strip of level-plus-tiny-sparkline stat chips with high/low-versus-history framing only, and full research cards behind them. Tariffs are the live exception: the effective burden can become fast-moving and consequential, so the panel supports a rule-triggered **current-policy callout**, fired only when the effective burden moves unusually fast by its own change-percentile, crosses a documented historical threshold, or a fresh observation materially changes its historical classification. The callout adds a line of copy; it never reorders the grid or promotes the measure into a sixth cyclical dimension.

Dimensions deliberately *not* created: "Housing" (split as described), "Business and manufacturing" (subsumed into A and E), "External risks" (too vague to have a rule; the backdrop plus tension detection covers it), and any expectations/forecast dimension (out of scope per product principles).

---

## 3. Complete indicator-role inventory

Roles: **Primary** — directly determines the dimension's condition/direction readings. **Supporting** — can confirm, qualify, or trigger a tension line, and appears in the tile's expandable evidence list, but does not by itself set the reading. **Deep-dive** — remains a full research card, linked from the tile, with no role in the compact computation.

| # | Card (Phase 1 name) | Briefing dimension | Role | Notes |
|---|---|---|---|---|
| 1 | Real GDP growth | Growth | **Primary** | Anchor metric for the dimension. |
| 2 | Real GDP per capita growth | Growth | Supporting | Redundant with GDP in the compact view; retained to qualify population-driven growth. |
| 3 | Productivity over time (level) | Growth | Deep-dive | A cumulative index is context, not a current-conditions signal. |
| 4 | Productivity growth momentum | Growth | Supporting | Qualifies whether growth is efficiency-driven; too revised and noisy to be primary. |
| 5 | Headline CPI inflation | Inflation | Supporting | Demoted from primary (Amendment A): the headline/core relationship card already contains the headline series, so a standalone primary would double-count it. Headline remains contractually named in every inflation synthesis sentence. |
| 6 | Headline vs core CPI | Inflation | **Primary** | Carries the dimension's inflation primary role: core sets the condition reading (persistence), headline is contained within the same card, and core is the anchor sparkline. |
| 7 | Recent inflation momentum (3-mo annualized) | Inflation | Supporting | Sets/qualifies the direction reading; too noisy to set condition. |
| 8 | Unemployment rate | Labor | Supporting | Context for the LMCI activity reading. |
| 9 | Prime-age employment-to-population | Labor | Supporting | Adds participation context. |
| 10 | Payroll growth (latest and 3-mo avg) | Labor | Supporting | Adds employer-demand context; revision-prone flag applies. |
| 11 | Initial unemployment claims (4-wk avg) | Labor | Supporting | Timeliest stress signal; can trigger a tension line; never sole basis of a reading. |
| 12 | Wages vs inflation (real wage growth) | Inflation | **Primary** | The purchasing-power half of dimension B; cross-linked from Labor. |
| 13 | Real income vs spending per person | Households | **Primary** | The sustainability comparison; spending persistently outrunning income is the key pattern. |
| 14 | Personal saving rate | Households | Supporting | Explicitly **unvalenced**: high/low vs history only, per existing product principles. |
| 15 | Household debt-service ratio | Households | **Primary** | Condition anchor: the cleanest single cushion/obligation measure. |
| 16 | Home-ownership cost share (HOAM) | Households | Supporting | Qualifies household conditions; short history (2005–) limits percentile claims. |
| 17 | Housing starts | Growth | Supporting | Interest-sensitive activity measure; early-moving qualifier for the growth reading. |
| 18 | Manufacturing output vs employment | Growth | Deep-dive | A structural relationship story, not a current-conditions reading. |
| 19 | Real business investment growth | Growth | **Primary** | The forward-leaning half of the growth reading; short history (2008–) disclosed. |
| 20 | Corporate profit share | Growth | Supporting | **Unvalenced** (high/low vs history only). Reclassified from deep-dive (Amendment B): tension-eligibility (profits high while investment weak) requires a computation role under this document's own role definitions. Qualifies the Growth narrative and feeds one cross-dimension tension rule; never sets a condition or direction chip. |
| 21 | Industrial capacity utilization | Growth | Supporting | **Unvalenced in v1** (high/typical/low only, Amendment C): a nonlinear favorable-until-bottleneck rule is deferred until the simpler briefing is tested. Qualifies the Growth narrative without affecting the chip; narrower sectoral base than GDP. |
| 22 | Fed funds vs 10-year Treasury | Credit | Supporting | Displayed as facts (levels, spread) without a condition verdict; the curve is not treated as a mechanical forecast, per existing principles. |
| 23 | Broad credit conditions (NFCI credit) | Credit | **Primary** | Anchor: constructed to be read against its own history, which matches the percentile machinery exactly. |
| 24 | Bank lending standards (SLOOS C&I) | Credit | **Primary** | Direction-oriented survey; sign semantics preserved (positive = net tightening). |
| 25 | Federal budget balance %GDP | Backdrop | Supporting | High/low framing only; no favorable/unfavorable rule. |
| 26 | Federal debt held by public %GDP | Backdrop | Supporting | Same. |
| 27 | Trade balance %GDP | Backdrop | Supporting | Explicitly unvalenced, consistent with the current card. |
| 28 | Effective tariff burden | Backdrop | Supporting | Currently the most policy-live backdrop item; copy may flag large moves. |

**Redundancy in the briefing (not in the research layer):** GDP per capita duplicates GDP for at-a-glance purposes; the standalone headline-CPI card duplicates the headline series inside the relationship card; the manufacturing relationship card and the productivity level card are analysis rather than status; the rate card's briefing content reduces to two numbers and a spread. All remain full research cards.

Story 30 creates a reviewed Labor exception to the original research-card count: its two primary datasets are LMCI Activity and Momentum rather than visible research cards. The other dimensions retain the proposed two-primary inventory pending their own vertical-slice reviews.

---

## 4. Recommended compact briefing anatomy

Each of the five dimension tiles contains, in descending visual priority:

**1. The human question** as the tile heading ("Can people find and keep work?"), continuing the questions-first principle.

**2. Two reading chips, never one:** a condition chip and a direction chip, using the controlled vocabulary of section 5 (e.g., `Condition: strong · Direction: cooling`). These are the at-a-glance payload. They are rendered as text labels, not as color alone, and color (if used at all) follows the analytical rule, never editorial judgment.

**3. One synthesis sentence,** produced by deterministic selection from a **finite, reviewed set of templates** — one template per analytical state, not one rigid structure per dimension (Amendment G) — with actual values inserted. The Labor tile alone carries distinct templates for at least: readings agree; favorable condition with deteriorating direction; unfavorable condition with improving direction; primary conflict (mixed); supporting tension present; stale primary evidence; insufficient data. Example output: *"Unemployment is 4.1% (36th percentile of the last 25 years) while payroll growth has slowed to a 90k three-month average; conditions remain solid but momentum is fading."* Never hand-written commentary, never generated free text: templates are part of the documented rule set, so changing a sentence means changing a reviewed rule, which keeps the briefing as auditable as the cards beneath it.

**4. One anchor sparkline:** the dimension's anchor metric over a fixed 10-year window, drawn over a shaded interquartile band and median line computed from the 25-year comparison window, with the latest observation marked. Ten years is long enough to include one full cycle (including the 2020 shock) and short enough that the current position is legible at sparkline size. No axes-free ambiguity: min/max/latest values are labeled. Anchor metrics: real GDP y/y (Growth); core CPI y/y (Inflation — persistence is the trend read; headline is always named in the sentence so the anchor choice cannot hide a food/energy divergence); unemployment rate (Labor); household debt-service ratio (Households); NFCI credit subindex (Credit).

**5. A tension line, only when triggered** by the rules in section 6. Its absence is informative; it never appears as decorative filler.

**6. Freshness line:** the as-of period of the *oldest primary input* ("Based on data through May 2026 (GDP) and June 2026 (investment)"), plus a staleness flag when section 6's rule fires, plus a "new" marker for seven days after a primary input updates.

**7. An evidence link** into the research layer, anchored to the dimension's cards.

**Expandable, not initially visible:** the supporting-indicator list (each with its own miniature condition/direction glyph and latest value), the "why this label" trace (rule name, window, percentile, inputs, thresholds), and full-history percentile context. Expansion is a native disclosure, keyboard-accessible, consistent with existing accessibility practice.

**Excluded from tiles by design:** dense strips of current/prior-year/5-year/median numbers (existing principle), any composite number for the dimension, and any cross-dimension aggregate.

The backdrop panel uses a reduced anatomy: label, latest value, tiny sparkline, high/low-versus-history phrase, as-of date, research link. No condition/direction chips.

Above the tiles, the page carries a one-line header with the global freshness range ("Data through July 11 – May 2026 depending on measure") and, when triggered, a **tensions strip** (section 6). Below the tiles sit the backdrop panel and the link to the full research briefing.

---

## 5. Condition and direction framework

### The core separation

Condition answers "where does this stand relative to history?" Direction answers "which way has it recently been moving, beyond noise?" They are computed independently, displayed as separate chips, and never merged. This is what lets the briefing say the things the brief demands: *strong but cooling* (labor 2026-style), *elevated but improving* (inflation 2023-style), *typical and stable*, *weak but recovering*.

### Condition: rule and vocabulary

**Machinery:** the latest observation's percentile within a **25-year trailing comparison window** (or the full committed history when shorter — flagged, as for business investment and debt service), mapped through a per-indicator **valence declaration**. Twenty-five years spans roughly three cycles and two structural eras; the full-history percentile is always available in the expanded trace as a second opinion, and a large divergence between the two is itself surfaced ("high for recent decades, ordinary across the full record").

**Valence declaration:** every primary and supporting indicator is classified once, in a reviewed table, as *valenced* (a direction of better exists: unemployment ↓, real wage growth ↑, claims ↓, GDP growth ↑, investment growth ↑, debt-service ↓, affordability-cost-share ↓, NFCI ↓, SLOOS net-tightening ↓) or *unvalenced* (saving rate, profit share, trade balance, budget balance, debt ratio, tariff burden, the rate levels, and — in v1 — capacity utilization). Unvalenced indicators only ever receive *high / typical / low* language. This table is the single most judgment-laden artifact in the design and is called out in section 12 for explicit human sign-off.

**Internal tiers** (Amendment D): nonoverlapping 20-point bands of the valence-oriented percentile, replacing the earlier overlapping bands whose direction-based resolution would have made condition partly dependent on direction — exactly the coupling the framework forbids. **Direction never alters the condition tier**; it may shape the synthesis sentence, never the band. A value falling exactly on a boundary belongs to the tier nearer to Typical (a deterministic, conservative tie rule).

| Valence-oriented percentile | Internal tier |
|---|---|
| 80–100 | Very favorable |
| 60–80 | Favorable |
| 40–60 | Typical |
| 20–40 | Unfavorable |
| 0–20 | Very unfavorable |

The internal rule is universal; the **displayed vocabulary is dimension-specific**, because forcing "strong" and "weak" onto every economic concept produces nonsense for prices and credit:

| Internal tier | Labor / Growth / Households | Inflation | Credit |
|---|---|---|---|
| Very favorable | Strong | Low and stable | Supportive |
| Favorable | Solid | Moderate | Relatively supportive |
| Typical | Typical | Typical | Typical |
| Unfavorable | Soft | Elevated | Restrictive |
| Very unfavorable | Weak | Very elevated | Highly restrictive |

The Growth and Households wording defaults to the Labor set unless the Labor-slice review finds better; all display vocabularies live in `briefing-rules.md`.

For short-history series, the displayed phrase must state the actual comparison start — "74th percentile since 2008" is materially different from "74th percentile over 25 years" — and the tile never silently presents a short window as if it were the standard one.

**No 2% reference line on CPI in v1** (Amendment E). The Federal Reserve's formal objective applies to PCE inflation, and even a disclosed 2% line on a CPI chart visually implies a CPI target that does not exist; here, no line is more accurate than an approximate line. Instead, v1 shows CPI against its historical distribution, headline versus core, and recent momentum, and the inflation tile's copy states plainly that the Fed's formal objective applies to PCE. A policy-target reference returns only if PCE inflation is later added as data — recorded in section 9 as the clean path, not a v1 requirement.

**Deflation display guard** (added in this revision). With a lower-is-better valence, a deflationary reading would land in the most favorable percentile tier and be labeled "low and stable" — which is wrong: falling prices are historically unusual and not benign. Rule: if headline or core year-over-year inflation is below zero, the valenced tier is suppressed for display and replaced with "prices falling — historically unusual," with the standard tier still visible in the trace. This is a display override, not a new analytical judgment, and it is the kind of edge the tier machinery cannot see on its own.

**Percentile caveats owned in the design:** percentiles are window-relative (the 2010s make many labor percentiles flattering); they treat all history as equally comparable, which section 7's comparability windows qualify; and they say nothing about rate of change — which is exactly why direction is a separate reading, not a footnote.

### Direction: rule and vocabulary

**Machinery:** the change over a per-frequency recent window — 6 months for monthly series, 13 weeks for weekly, 2 quarters for quarterly — compared against the historical distribution of *same-length changes* in the comparison window. A movement counts only if its absolute size exceeds the ~60th percentile of historical absolute changes for that indicator; smaller movements are "broadly stable." This noise gate is what prevents the briefing from narrating ordinary wiggle as trend, and it is the compact answer to "is the latest movement economically large or ordinary noise?"

**Vocabulary:** *improving / deteriorating / broadly stable* for valenced indicators; *rising / falling / broadly stable* for unvalenced ones; plus two special states:

- **Normalizing** (Labor only in v1, per Amendment F): the movement is adverse by valence and passes the noise gate, **but** the condition tier remains on the favorable side. Copy pattern: "cooling toward its historical norm" — and the synthesis sentence must still name the actual deterioration with values, e.g., *"Unemployment remains low relative to the last 25 years, but it has risen materially over six months; conditions are still solid while moving toward their historical norm."* The chip alone is never allowed to soften a movement the sentence doesn't state. The moment the level crosses the median while still moving adversely, the label switches to "deteriorating" — the rule, not editorial mood, decides when cooling becomes weakening. Rationale for the narrow scope: a rapid deterioration from an exceptionally favorable starting point can be economically significant well before the median is crossed, so the state is validated against historical labor episodes before any other dimension may adopt it.
- **No fresh evidence:** the staleness rule (section 6) has fired; the direction chip is replaced by this state rather than repeating the last computed direction.

### Dimension-level readings are logic, not averages

A dimension's condition chip: if all primaries agree in tier-group (favorable-side / typical / unfavorable-side), the shared reading is shown; otherwise the chip reads **mixed** and the synthesis sentence must name both sides with values. The same rule produces the direction chip, with "mixed" likewise triggering a mandatory naming sentence. There is no weighting scheme to tune and nothing for a conflict to hide inside — by construction, disagreement is louder than agreement.

Two page-level prohibitions are permanent: no reading above the dimension level (no "overall economy" chip), and no chip without a reachable trace.

---

## 6. Rules for conflict, uncertainty, freshness, and revisions

### Conflict

**Within a dimension:** primary disagreement forces the "mixed" chip and a named-tension sentence, as above. Supporting indicators cannot flip a chip. A supporting indicator triggers a **tension line** only when it clears **both bars**: its movement passes its own direction noise gate, **and** its level sits in an adverse or historically unusual range. Mere disagreement is not enough — requiring level and movement together keeps the tile from emitting a stream of low-value tensions. Example under a solid labor reading — e.g., claims rising sharply under a solid labor reading: *"Initial claims (4-week average) have risen to X, the fastest deterioration since ___; unemployment and payrolls do not yet confirm."* The brief's example conflicts map directly: payrolls slowing under low unemployment → labor direction "cooling/normalizing" with both named; spending outrunning income while debt service stays moderate → households "mixed" with the sustainability sentence; headline falling while 3-month core accelerates → inflation direction "mixed" naming both; profits rising while lending standards tighten → cross-dimension tension (below).

**Across dimensions:** a small reviewed catalog of cross-dimension tension rules — initially exactly four, each separately documented and tested: (1) credit conditions deteriorating while growth readings remain favorable; (2) household spending outrunning income while the saving rate weakens; (3) corporate profit share high while business investment is weak; (4) inflation improving while real purchasing-power growth remains unfavorable — populates the **tensions strip** at the top of the page when triggered. No generic engine comparing every indicator to every other indicator is built; new rules enter only through review. The strip exists precisely to do what single-metric commentary does not: lead with the disagreement. When nothing is triggered, the strip is absent — an empty "no notable tensions" banner would train the reader to ignore it.

**Copy discipline for all conflict text:** name both measures, give both values, attribute no cause. "X while Y" is the sanctioned pattern; "because," "despite the Fed," and similar causal framings are prohibited in templates.

### Uncertainty: two distinct states

*Mixed* means good evidence pointing in different directions. *Unclear* means insufficient evidence: primary data stale beyond threshold, a gap in a derived series, or all movements inside the noise gate on a series too short for a stable gate. The two must never share a label, because they demand opposite reader responses (dig into the conflict vs. wait for data).

### Freshness

Every tile shows the observation period of its oldest primary input. Staleness rule: an observation older than **1.5× its expected release cadence** gets a visible stale flag; older than **2×**, the direction chip becomes "no fresh evidence" and the condition chip carries an age qualifier ("as of Q4 2025"). Both multipliers are named configuration values in `briefing-rules.md`, not embedded constants, and cadence expectations live in the refresh configuration that already exists per series. The Labor slice validates the freshness behavior against five concrete scenarios: claims updated normally while payrolls await release; payrolls current but a refresh failed; all labor data stale because the dashboard was not refreshed; a missing claims week; and a new release that revises prior payroll observations. Because refresh is manual (an accepted Phase 1 limitation), whole-dashboard staleness is possible; the page header therefore also shows the last successful refresh date, and a fully stale page says so at the top rather than tile by tile. A new primary observation carries a "new" marker for seven days. **The absence of a new observation is never described as stability** — templates literally have no path from "no new data" to "stable."

### Revisions

The repository stores latest-vintage data only (accepted limitation), so the briefing cannot quantify revisions. It can and must disclose exposure: payroll growth, GDP, investment, and profit-share readings carry a standing "initial estimates; commonly revised" badge in the trace and a one-clause qualifier in synthesis sentences when the reading depends on the most recent one or two observations of a revision-prone series. If vintage storage is ever added (a Phase 2 candidate in the limitations table), the badge can graduate into typical-revision-size context; until then the briefing makes no revision-magnitude claims.

---

## 7. Historical-context strategy

The compact layer answers five context questions with four instruments:

**Is the current value historically high or low?** The condition percentile, stated against both windows in the expanded trace ("38th percentile since 2001; 61st since 1960"). Divergence between windows is surfaced as its own phrase because it answers the brief's "unusual only recently, or across decades?" question directly.

**Is the latest movement large or noise?** The direction noise gate (section 5), which is a percentile of historical *changes* rather than levels. This is deliberately preferred over z-scores: several of these series (claims, starts, NFCI) are skewed or fat-tailed enough that standard deviations mislead, while change-percentiles are distribution-agnostic and explainable in one sentence.

**Where does today sit visually?** The sparkline's interquartile band and median line — the compact visual substitute for the research cards' full charts, consistent with the "visuals for context, numbers for emphasis" principle.

**Is this level common in expansions or recessions?** Honestly answerable only with recession dating, which Phase 1 deliberately excludes. Recommendation: add **NBER reference dates as a context dataset** (not an indicator card) during the historical-context stories, enabling recession shading on expanded charts and, later, factual comparable-episode phrasing ("last at this level: mid-2003, late 2009"). Until then the briefing does not fake this answer. Shading is annotation of official dating, not a causal or forecasting claim, and so stays within existing principles; the "no recession shading" line in the limitations table is superseded only by explicit approval of this addition.

**Are distant comparisons valid?** Each indicator's metadata gains a documented **comparability note and window**, added incrementally starting with the indicators the briefing actually uses rather than backfilled across all 28 cards before the briefing can ship (e.g., pre-1994 unemployment survey redesign; CPI methodology evolution; SLOOS panel changes already flagged in limitations). Percentile phrases against the full window are suppressed or qualified for indicators whose notes say the early history is not conceptually comparable. This keeps long-run context available without laundering methodology breaks into false precision.

Rejected instruments, with reasons: composite "distance from normal" scores (reintroduce the forbidden single score at dimension level); "record high/low since records began" phrasing (series lengths differ wildly — a 2008-start series makes "record" trivially cheap); automatic trend lines or fitted curves (imply forecasts).

---

## 8. Relationship between the briefing and the research layer — and product boundaries

### Layering

The briefing becomes the default route once all five tiles pass review; the current dashboard remains in full at a `/research` route (or equivalent), unchanged in content and contract. The mapping is strictly one-way: the briefing computes only from the same committed, validated datasets the cards use, through the same repositories; it introduces no new data acquisition of its own except the optional NBER dates. Every tile links to its evidence cards; every card can link back up. All synthesis rules — valence table, windows, tiers, noise gates, staleness multipliers, templates, tension catalog — live in a new `docs/briefing-rules.md` that has the same source-of-truth status for interpretation that `data-refresh.md` has for data. A reader who distrusts a chip can, in two interactions, reach the rule and the raw observations that produced it. That traceability is the product's answer to "how is this not just another opinionated dashboard?"

### Boundaries: the economy is not the market

The briefing describes the **economy**. It excludes equity prices, index levels, valuations, earnings expectations, portfolio implications, and trade ideas — permanently, not just in v1. Two of its dimensions (Credit, and rates within it) describe *financing conditions for the real economy*, which is the correct and sufficient amount of financial-system content for this product; the existing cards already frame them that way.

For the stated personal goals around investing: the briefing serves them indirectly and honestly — it describes the economic environment, exposes conflicting evidence, and resists headline bias, which is the durable value for an investor; it does not time anything. If market context is ever wanted, the recommendation is a **separate connected view** (a distinct route sharing the architecture but visually and conceptually separated), never intermixed tiles — because the moment an S&P sparkline sits beside the unemployment chip, the product implies the equivalence it was built to resist. That decision does not need to be made now; it only needs to not be made accidentally.

Deliberately out of scope for the briefing layer, consistent with existing principles: forecasts, turning-point calls, policy evaluation, causal attribution, and any distributional claims beyond the standing aggregate caveats.

---

## 9. Remaining metric gaps

**Conclusion: no new indicator is required before the synthesis work begins.** The 28-card inventory, after the three post-Story-21 additions, covers every primary and supporting role in the design above. Three candidates were evaluated and only one small *dataset* (not indicator) addition is recommended:

**NBER recession reference dates — recommended, during the historical-context stories.** Answers "is this level common in expansions or recessions?", which nothing in the current inventory can answer and which the briefing otherwise must decline to address. It is a context dataset with no card, no valence, and no reading of its own. Not necessary for the first vertical slice; necessary before episode-comparison phrasing ships. Overlaps nothing.

**JOLTS job openings or quits rate — not recommended now.** Would add a labor-*demand* reading distinct from the stock and flow measures already present, and the quits rate is a genuinely different signal (worker confidence). But unemployment + payrolls + claims + prime-age EPOP already give the labor tile the densest evidence set of any dimension, and the design principle is that more indicators do not automatically improve the product. Revisit only if, after the labor slice runs on real data for a while, the tile proves persistently "unclear" in ways a demand measure would resolve. Deep-dive candidate at most.

**Consumer inflation expectations — not recommended.** It answers "do people expect inflation to persist?", which the current inventory cannot, but it is an expectations measure and therefore belongs to the explicitly deferred forecasting/expectations layer, not to a descriptive briefing. Adding it now would blur the product's most carefully drawn line for modest interpretive gain over core-CPI persistence.

**PCE inflation — recorded as the clean future path, not a v1 requirement.** With the 2% reference line rejected for CPI (Amendment E), the only accurate way to ever show distance from the Federal Reserve's formal objective is to add PCE inflation itself. It overlaps CPI substantially and is not needed for the briefing to function; it becomes worth adding only if the inflation tile's review concludes that policy-objective context is genuinely missing. Until then, the copy rule — stating that the Fed's objective applies to PCE — carries the disclosure.

Real median household income, regional and distributional measures, and vintage data remain what the limitations table already classifies them as: Phase 2 candidates contingent on adopting a different objective, not blind spots in this one.

---

## 10. Conceptual layout proposal

**Desktop (single screen, little or no scrolling):**

```
┌──────────────────────────────────────────────────────────────────────┐
│ U.S. Economic Briefing        Data through Jul 11 – May 2026 · ⟳ Jul 17 │
│ [Tensions strip — only when rule-triggered: "Credit tightening while  │
│  growth readings improve: NFCI x.xx vs GDP +x.x%"]                    │
├──────────────────────┬──────────────────────┬────────────────────────┤
│ GROWTH & ACTIVITY    │ INFLATION &          │ LABOR MARKET           │
│ Is the productive    │ PURCHASING POWER     │ Can people find and    │
│ economy expanding?   │ Are prices stable &  │ keep work?             │
│ [cond] [direction]   │ pay keeping up?      │ [cond] [direction]     │
│ synthesis sentence   │ [cond] [direction]   │ synthesis sentence     │
│ ~sparkline + band~   │ synthesis sentence   │ ~sparkline + band~     │
│ ⚠ tension (if any)   │ ~sparkline + band~   │ as-of · evidence →     │
│ as-of · evidence →   │ as-of · evidence →   │                        │
├──────────────────────┼──────────────────────┼────────────────────────┤
│ HOUSEHOLD FINANCES   │ CREDIT & FINANCIAL   │ FISCAL & EXTERNAL      │
│ Are resources,       │ CONDITIONS           │ BACKDROP               │
│ cushions, and        │ Is financing helping │ deficit −x.x% GDP ~sp~ │
│ obligations          │ or restraining?      │ debt xx% GDP     ~sp~  │
│ sustainable?         │ [cond] [direction]   │ trade −x.x% GDP  ~sp~  │
│ [cond] [direction]   │ synthesis sentence   │ tariff x.x%      ~sp~  │
│ synthesis sentence   │ ~sparkline + band~   │ high/low vs history    │
│ ~sparkline + band~   │ as-of · evidence →   │ as-of · research →     │
│ as-of · evidence →   │                      │                        │
├──────────────────────┴──────────────────────┴────────────────────────┤
│ Full research briefing (28 cards) →                                  │
└──────────────────────────────────────────────────────────────────────┘
```

A 3×2 grid: five dimension tiles plus the backdrop panel occupying the sixth cell, which keeps everything on one desktop screen and gives the backdrop presence without tile-grade prominence. Fixed reading order — Growth, Inflation, Labor, Households, Credit — follows macro convention (output → prices → labor → sector balance sheets → financing) and never reorders by "importance," since reordering is itself an editorial verdict.

**Narrow screens:** tiles stack in the same order; the tensions strip stays at top; the backdrop panel collapses to a disclosure; sparklines keep their bands (they are the context, not decoration). Everything remains reachable by keyboard with visible focus; chips, sentences, and traces are native text, so the compact view is *more* screen-reader-friendly than canvas charts, and each sparkline carries the same factual-summary treatment the research charts already have.

Visual-prominence rules, restated: chips and sentence over sparkline; sparkline over tension; tension over freshness; everything over the expandable trace. No color-only meaning. No decorative iconography carrying analytical content.

---

## 11. Implementation sequence

Product decisions come first; each subsequent step is a small, reviewable story satisfying the existing repository completion standard; the research cards are never modified except to add anchor links.

**Step 0 — human product decisions (no code).** Approve or amend: the five dimensions and backdrop membership; the primary/supporting/deep-dive inventory (section 3); the valence table; anchor metrics; the vocabulary tiers, windows, and noise gate; the template-only synthesis policy; the 2% reference-line exception. Output: an approved `docs/briefing-rules.md` draft. Everything downstream depends on this.

**Story 1 / Story 26 — synthesis rule engine, no UI. Complete.** Pure, tested functions over already-loaded observations implement comparison-window percentile, tier mapping with valence, per-frequency direction with noise gate, normalizing detection, staleness evaluation, and dimension-level agree/mixed logic. `docs/briefing-rules.md` is the interpretation source of truth, and deterministic tests pin every worked example. No dependencies were added.

**Story 2 / Story 27 — one vertical slice: the Labor tile. Complete.** The non-default `/briefing` route renders the full Labor-only tile anatomy, finite template sentences, accessible unemployment sparkline, freshness, disclosures, and research links using Story 26's engine and the existing repositories. Labor goes first because it has the richest stock/flow structure, a live normalization-versus-weakness question in current data, and the timeliest inputs — if the framework works anywhere convincingly, it must work here.

**Step 3 / Story 28 — initial human review checkpoint against real data. Complete, later superseded.** The review reconciled the tile with all four research cards and exposed a structural flaw in the symmetric two-primary interpretation. Its historical findings remain recorded in `docs/labor-briefing-review.md`, but its readiness conclusion is no longer current.

**Story 29 — corrected Labor rules and grid-cell layout. Complete: ready with documented cautions.** Condition now uses unemployment as anchor and prime-age employment as confirmer; direction uses payroll movement as anchor and unemployment movement as confirmer. Payroll level cannot affect condition, claims remain supporting only, the synthesis uses reader-facing language, and the compact tile has passed re-review in a 3×2 skeleton with responsive two- and one-column layouts. The dated re-review in `docs/labor-briefing-review.md` is the current readiness decision.

**Story 30 — LMCI Labor headline and compact visual tile. Complete.** Kansas City Fed LMCI Activity and Momentum replace the homegrown Labor headline. Full-history percentiles drive an outlined activity bar and bounded crosshair arrow; the four prior labor measures remain expanded supporting evidence only. Story 30 supersedes the Labor-specific Story 29 model without changing the research cards or full briefing grid.

**Story 31 — deterministic plain-English Labor answer. Complete.** The collapsed Labor tile now answers its question before the visuals using reviewed activity and momentum clause maps plus a deterministic `and`/`but` rule. Missing or stale primary classifications use explicit fallbacks, and the expanded state does not duplicate the answer.

**Stories 4–7 — remaining tiles, one story each:** Inflation & purchasing power (exercises dimension-specific vocabulary, the deflation guard, and the PCE-objective copy rule), Growth (exercises short-history display, quarterly staleness, and the unvalenced supporting indicators), Households (exercises unvalenced saving-rate handling and the standing aggregate caveat), Credit (exercises sign semantics and index-valued anchors). Each ends with a mini review.

**Story 8 — conflict layer:** within-dimension tension lines and the cross-dimension tension catalog and strip, with tests for every cataloged rule, including the brief's six example conflicts as fixtures.

**Story 9 — freshness surface and backdrop panel:** staleness flags, "new" markers, refresh-date header, the backdrop strip.

**Story 10 — promotion:** `/briefing` becomes the default route; the full dashboard moves to `/research` with navigation both ways; README and `product-overview.md` updated per documentation rules.

**Optional follow-ups, each individually approvable:** NBER dates dataset and recession shading on expanded charts; comparable-episode phrasing; comparability-window metadata backfill across all 28 cards; revision-badge refinement.

Dependencies: 1 → 2 → 3 → (4–7, parallelizable in principle but sequential in practice per one-story-at-a-time rules) → 8 → 9 → 10. No large framework is built before one dimension is proven; the engine in Story 1 is small because the rules in Step 0 are small.

---

## 12. Step 0 decision record

The following decisions are approved and become the baseline of `docs/briefing-rules.md`. Amendment letters refer to the team review incorporated in this revision.

1. **Architecture:** five cyclical dimensions (Growth & business activity; Inflation & purchasing power; Labor; Household finances; Credit & financial conditions) plus one structural backdrop panel (budget balance, public debt, trade balance, tariff burden).
2. **No overall reading:** no economy-wide score, chip, or verdict, permanently.
3. **Separate readings:** condition and direction are computed and displayed independently; direction never alters the condition tier.
4. **Comparison window:** trailing 25 years as the primary modern comparison, full committed history as secondary context; short-history series always display their actual comparison start.
5. **Condition bands:** nonoverlapping 20-point valence-oriented percentile tiers (Amendment D), with a boundary value assigned to the tier nearer Typical.
6. **Vocabulary:** one universal internal tier scale with dimension-specific display language; Growth and Households default to the Labor wording pending slice review.
7. **Inflation reference:** no 2% line on the CPI chart in v1 (Amendment E); copy states that the Fed's formal objective applies to PCE; deflation display guard applies when year-over-year inflation is negative.
8. **Direction windows:** 13 weeks / 6 months / 2 quarters as provisional, configurable defaults.
9. **Noise gate:** historical absolute-change percentile, initially the 60th, provisional pending Labor-slice review.
10. **Normalizing:** implemented for the Labor dimension only in v1 (Amendment F); requires a noise-gate-passing adverse move plus a still-favorable condition tier; the sentence must name the deterioration with values; generalization requires validation against historical episodes.
11. **Conflict:** disagreement between a dimension's two primaries forces Mixed; no averaging, ever; "X while Y" with both values is the mandatory copy pattern.
12. **Uncertainty:** Mixed (conflicting adequate evidence) and Unclear (stale, missing, or inadequate evidence) are distinct states in the data model, UI, and copy.
13. **Supporting tensions:** require both a noise-gate-passing movement and an adverse or historically unusual level, to suppress low-value alerts.
14. **Cross-dimension tensions:** a reviewed catalog of exactly four rules to start (section 6); no generic pairwise comparison engine.
15. **Synthesis:** deterministic selection from a finite reviewed template set covering each analytical state (Amendment G); no hand-written commentary and no generated free text anywhere in the briefing.
16. **Freshness:** oldest-primary as-of on every tile; 1.5×/2× cadence multipliers as configurable values; direction suppressed when evidence is too old; absence of a release is never described as stability; page-level refresh date shown.
17. **Revisions:** standing "commonly revised" badge in the trace for payrolls, GDP, investment, and profit share; a sentence-level qualifier only when the reading leans on one preliminary observation.
18. **Inventory amendments:** standalone headline CPI card Primary → Supporting (Amendment A); corporate profit share Deep-dive → Supporting, unvalenced (Amendment B); capacity utilization Supporting and unvalenced in v1 (Amendment C). Final primary set: exactly two per dimension, ten in total.
19. **Backdrop:** fiscal, debt, trade, and tariff measures carry no condition/direction chips; tariffs get the rule-triggered current-policy callout only.
20. **Boundaries:** no market data, valuations, or portfolio content in this briefing; any future market context is a separate connected view, a decision deferred without prejudice.
21. **Sequence:** rule engine first, then one complete Labor tile on a non-default `/briefing` route, then the review gate, then the remaining tiles, conflict layer, freshness surface, and promotion.
22. **NBER dates and comparability notes:** approved in principle as later context additions; neither blocks the Labor slice; comparability notes are added incrementally to briefing-used indicators only.

### Open items deliberately deferred to the Labor-slice review (Step 3)

These are parameters, not architecture, and are settled against real output rather than in the abstract: the exact tier thresholds and the 60th-percentile noise gate; the direction-window lengths per frequency; the staleness multipliers; the Growth/Households display vocabulary; template phrasing and tone; whether Normalizing generalizes beyond Labor; whether PCE inflation is added (section 9); and the timing of promoting `/briefing` to the default route (Story 10 as proposed, or a longer parallel run).

---

*End of proposal, v1.1 final. Sections 3, 5, 6, and the section 12 decision record convert nearly line-for-line into `docs/briefing-rules.md`; section 11 converts into the story sequence, beginning with the rule-engine story.*
