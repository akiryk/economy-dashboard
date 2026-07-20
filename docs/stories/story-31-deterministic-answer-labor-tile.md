# Story 31 — Add a deterministic plain-English answer to the Labor Market tile

## User story

**As a** dashboard user
**I want** the Labor Market tile to answer its own question in plain English
**so that** I do not have to infer the meaning of the activity bar and momentum arrow.

---

## Context

The collapsed Labor Market tile currently shows:

- the question **Can people find and keep work?**
- an LMCI Activity visual and five-tier label;
- an LMCI Momentum visual and five-tier label;
- a **More** control.

The graphics communicate historical position and momentum, but they do not reliably answer the question without interpretation.

Add one concise deterministic sentence to the collapsed tile. The sentence must translate the two existing LMCI tiers into direct language about finding and keeping work.

This story does not change:

- the LMCI data source;
- percentile calculations;
- tier thresholds;
- activity-bar behavior;
- momentum-arrow behavior;
- supporting evidence;
- expanded-state information architecture.

---

## Required collapsed-state hierarchy

The collapsed tile must contain, in this order:

1. Eyebrow: **LABOR MARKET**
2. Question: **Can people find and keep work?**
3. Deterministic plain-English answer
4. The existing Activity and Momentum visual blocks
5. Full-width **More** control

The answer must be visible before the user selects **More**.

Do not hide the answer in the expanded state.

---

## Deterministic sentence construction

Build the answer from:

- one activity clause;
- one momentum clause;
- one deterministic connector.

Do not maintain 25 independently written sentences.

Do not generate free-form prose.

### Activity clauses

| Activity tier       | Clause                                                           |
| ------------------- | ---------------------------------------------------------------- |
| **Well Below Avg.** | People are finding and keeping work much less readily than usual |
| **Below Avg.**      | People are finding and keeping work less readily than usual      |
| **Near Avg.**       | People are finding and keeping work about as readily as usual    |
| **Above Avg.**      | People are finding and keeping work more readily than usual      |
| **Well Above Avg.** | People are finding and keeping work much more readily than usual |

### Momentum clauses

| Momentum tier             | Clause                               |
| ------------------------- | ------------------------------------ |
| **Weakening Sharply**     | conditions are weakening sharply     |
| **Weakening**             | conditions are weakening             |
| **Steady**                | conditions are holding steady        |
| **Strengthening**         | conditions are strengthening         |
| **Strengthening Sharply** | conditions are strengthening sharply |

The final sentence must:

- begin with the activity clause;
- insert the connector;
- append the momentum clause;
- end with a period.

Example:

> People are finding and keeping work about as readily as usual, and conditions are holding steady.

---

## Connector rule

Assign directional values to the tiers:

### Activity

| Tier            | Value |
| --------------- | ----: |
| Well Below Avg. |  `-2` |
| Below Avg.      |  `-1` |
| Near Avg.       |   `0` |
| Above Avg.      |   `1` |
| Well Above Avg. |   `2` |

### Momentum

| Tier                  | Value |
| --------------------- | ----: |
| Weakening Sharply     |  `-2` |
| Weakening             |  `-1` |
| Steady                |   `0` |
| Strengthening         |   `1` |
| Strengthening Sharply |   `2` |

Use:

- **but** when both values are nonzero and have opposite signs;
- **and** in every other case.

Examples:

> People are finding and keeping work less readily than usual, but conditions are strengthening.

> People are finding and keeping work more readily than usual, but conditions are weakening.

> People are finding and keeping work much less readily than usual, and conditions are weakening sharply.

> People are finding and keeping work about as readily as usual, and conditions are strengthening.

Do not use **while**, **although**, or other connector variants in this story.

---

## Interpretation limits

The sentence is a plain-English translation of the Kansas City Fed LMCI Activity and Momentum classifications.

It must not claim that the LMCI directly measures:

- an individual job seeker’s probability of finding work;
- a worker’s probability of avoiding dismissal;
- the number of job openings;
- the number of layoffs;
- payroll growth alone.

The expanded methodology disclosure may clarify that the assessment summarizes a broad set of labor-market indicators.

Do not add hedging language such as:

- perhaps;
- probably;
- seemingly;
- somewhat.

The tier classifications already encode the intended degree.

---

## Missing, stale, or unavailable states

Do not generate a normal 25-combination answer when either primary LMCI classification is unavailable.

Use deterministic fallback language.

### Activity unavailable

> Current labor-market activity cannot be assessed from the available data.

If Momentum is current, a second clause may be appended:

> Current labor-market activity cannot be assessed from the available data, but momentum is holding steady.

Use the same approved momentum wording.

### Momentum unavailable or too stale

If Activity is current:

> People are finding and keeping work about as readily as usual, but there is no fresh evidence about whether conditions are changing.

Substitute the correct activity clause.

### Both unavailable

> Current labor-market conditions cannot be assessed from the available data.

Reuse the project’s existing freshness and missing-data semantics where available. Do not treat missing or stale Momentum as **Steady**.

---

## Presentation

The answer should:

- appear between the question and the two metric blocks;
- use normal body text rather than headline typography;
- remain visually subordinate to the question;
- remain more prominent than expanded methodology;
- wrap naturally within the compact tile;
- avoid increasing the tile height more than necessary.

Do not:

- repeat the visible tier labels verbatim in the sentence;
- show raw LMCI values in the collapsed state;
- show percentile values in the collapsed state;
- add another heading such as **Answer** or **Summary**;
- animate the sentence.

Use existing typography, spacing, and responsive tokens.

---

## Architecture

Implement sentence construction as pure domain logic.

Separate:

1. activity-tier-to-clause mapping;
2. momentum-tier-to-clause mapping;
3. connector selection;
4. fallback handling;
5. presentation.

Do not construct the sentence through nested conditional JSX.

Prefer an exhaustive typed mapping so an added or renamed tier causes a type or test failure rather than silently falling through.

The sentence builder should accept the already-derived Activity and Momentum classifications. It must not recalculate percentiles or tiers.

---

## Acceptance criteria

- The collapsed tile displays one plain-English answer before the visuals.
- The current **Near Avg. + Steady** state displays:

  > People are finding and keeping work about as readily as usual, and conditions are holding steady.

- All 25 normal Activity/Momentum combinations produce deterministic grammatical sentences.
- Opposite nonzero Activity and Momentum signs use **but**.
- All other normal combinations use **and**.
- The sentence uses the approved clause wording exactly.
- The sentence does not expose raw LMCI values or percentiles.
- Missing or stale primary readings use fallback language rather than a misleading normal sentence.
- The expanded state does not duplicate the same answer unless an existing accessibility or structural requirement requires it.
- The existing Activity and Momentum visuals and labels remain unchanged.
- The existing **More** interaction remains functional.
- The tile remains usable at compact desktop and narrow viewport widths.
- No page-level horizontal overflow is introduced.

---

## Tests

Add deterministic tests covering:

### Clause mappings

- all five Activity tiers;
- all five Momentum tiers.

### All combinations

Test all 25 normal combinations, including at minimum:

- Near Avg. + Steady;
- Below Avg. + Strengthening;
- Above Avg. + Weakening;
- Well Below Avg. + Weakening Sharply;
- Well Above Avg. + Strengthening Sharply;
- Near Avg. + Strengthening;
- Above Avg. + Steady.

### Connector logic

- opposite nonzero signs produce **but**;
- matching signs produce **and**;
- either zero value produces **and**.

### Fallbacks

- Activity unavailable;
- Momentum unavailable;
- Momentum stale;
- both unavailable.

### UI

- answer is visible while the tile is collapsed;
- answer appears before the metric blocks in reading order;
- answer remains visible after expanding and collapsing;
- raw LMCI values remain absent from the collapsed state;
- accessible reading order is question → answer → Activity → Momentum → More;
- narrow viewport does not overflow.

---

## Documentation

Update the briefing rules or Labor tile documentation to record:

- the collapsed tile now includes a direct answer to its human question;
- the answer is generated deterministically from the existing five Activity tiers and five Momentum tiers;
- the approved clause tables;
- the **and/but** connector rule;
- missing and stale-data fallbacks;
- the interpretation limitation that LMCI is a broad labor-market assessment rather than a direct individual job-finding probability.

---

## Non-goals

- Do not change the LMCI source or refresh pipeline.
- Do not change percentile calculations or comparison history.
- Do not change tier boundaries or tier labels.
- Do not redesign the Activity bar or Momentum arrow.
- Do not change the expanded supporting-evidence content in this story.
- Do not create 25 separately maintained sentences.
- Do not use AI-generated or hand-edited runtime commentary.
- Do not add causal explanations.
- Do not introduce mechanism-specific language such as **more layoffs** or **hiring up**.
- Do not move the answer behind **More**.

---

## Verification

Before completion, run the repository’s required verification suite, including:

- lint;
- typecheck;
- tests;
- production build;
- desktop browser review;
- narrow-viewport browser review;
- keyboard and screen-reader-oriented reading-order review;
- `git diff --check`.

Completion requires committed implementation, tests, and documentation.
