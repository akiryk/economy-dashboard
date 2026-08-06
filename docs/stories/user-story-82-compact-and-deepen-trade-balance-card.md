# User Story 82 — Compact and deepen the U.S. trade-balance card

## User story

As a dashboard reader, I want to understand the size and direction of the U.S. trade deficit or surplus, so that I can see how much more the United States buys from the world than it sells, how that gap is changing, and what the balance does and does not imply about the economy.

## Objective

Convert the existing trade-balance card to the compact-card pattern and deepen the expanded view.

The compact card should:

- use a state-dependent question;
- show the current trade deficit or surplus as a positive magnitude;
- translate the ratio into plain language;
- show whether the gap widened or narrowed over five years;
- compare the current magnitude with historically comparable deficit or surplus periods;
- keep the default interpretation concise;
- place longer interpretation behind **Why this matters**;
- preserve the signed trade-balance series in the expanded view;
- add goods-versus-services and exports-versus-imports context under **More**.

Do not present a trade deficit as automatically bad or a trade surplus as automatically good.

## Scope and definition

1. Keep the card in the **Trade Flows** section on the main dashboard.
2. Preserve the authoritative quarterly trade-balance source and exact-quarter alignment.
3. Define the signed balance as `exports of goods and services − imports of goods and services`.
4. Preserve the sign convention:
   - negative means deficit;
   - positive means surplus;
   - zero means balance.
5. Make clear that the measure includes both goods and services.
6. In help text, include examples of services such as software, legal and consulting services, finance, transportation, travel, research, intellectual property, film, television, music, and audiovisual services.
7. Do not imply that the trade balance covers only physical merchandise.

## State-dependent question

8. Determine the latest state from the unrounded signed balance.
9. Use the project’s existing neutral range around zero where available.
10. If none exists, use **−0.1% through +0.1% of GDP, inclusive** as approximately balanced.

11. Use these questions:

### Trade deficit

> **How large is the U.S. trade deficit relative to the economy?**

### Trade surplus

> **How large is the U.S. trade surplus relative to the economy?**

### Approximately balanced

> **Is U.S. trade approximately balanced?**

## Hero value and direct answer

12. Show the compact hero as an unsigned magnitude.

### Deficit example

> **2.7% of GDP**

Label:

> **Trade deficit**

### Surplus example

> **1.1% of GDP**

Label:

> **Trade surplus**

### Approximately balanced example

> **0.1% of GDP**

Label:

> **Approximately balanced**

13. Do not show a minus sign in the compact hero.
14. Preserve the signed value in the underlying data and expanded view.
15. Show the latest quarter.

16. Use state-specific direct answers.

### Deficit

> **The United States imported more goods and services than it exported by an amount equal to 2.7% of GDP.**

> **That is about $2.70 more in imports than exports for every $100 of economic output.**

### Surplus

> **The United States exported more goods and services than it imported by an amount equal to 1.1% of GDP.**

> **That is about $1.10 more in exports than imports for every $100 of economic output.**

### Approximately balanced

> **U.S. exports and imports of goods and services were approximately balanced relative to the size of the economy.**

17. Match dollars-per-$100 wording to the displayed precision.

## Recent direction

18. Add a visible statement comparing the latest magnitude with five years earlier.

19. In deficit mode:

- larger current magnitude:

  > **The trade deficit has widened by [X] percentage points over the past five years.**

- smaller current magnitude:

  > **The trade deficit has narrowed by [X] percentage points over the past five years.**

- approximately unchanged:

  > **The trade deficit is little changed from five years ago.**

20. In surplus mode, use equivalent widened, narrowed, and unchanged wording.

21. If the state changed between the latest quarter and five years earlier, do not use widened or narrowed across unlike states.

22. Use:

> **The balance moved from surplus to deficit over the past five years.**

or:

> **The balance moved from deficit to surplus over the past five years.**

23. Use the project’s established neutral convention. If none exists, treat an absolute five-year magnitude change below **0.2 percentage points** as approximately unchanged.

## Compact chart transformation

24. Use a state-dependent positive-magnitude compact chart.

25. In deficit mode:

`trade deficit magnitude = max(0, −signed trade balance)`

26. In surplus mode:

`trade surplus magnitude = max(0, signed trade balance)`

27. In approximately balanced mode:

`trade-balance magnitude = abs(signed trade balance)`

28. Show all compact values as nonnegative percentages of GDP.
29. In deficit mode, zero means no deficit and higher means a larger deficit.
30. In surplus mode, zero means no surplus and higher means a larger surplus.
31. In approximately balanced mode, zero means perfect balance and higher means farther from balance.
32. Keep the compact chart to the latest five years of quarterly observations.
33. Preserve null gaps. Do not interpolate or carry values forward.
34. Use the established compact chart pattern with a line, historical bands, latest marker, visible dates, and pointer/tap/keyboard access.
35. Do not invert the y-axis.
36. Do not show a signed negative scale in the compact view.

## Historical bands

37. Make the historical bands state-dependent.
38. In deficit mode, calculate middle-50% and middle-80% bands from historical **deficit quarters only**, using positive deficit magnitudes.
39. In surplus mode, calculate bands from historical **surplus quarters only**, using positive surplus magnitudes.
40. In approximately balanced mode, calculate bands from absolute balance magnitudes across all valid quarters.
41. Do not mix deficit and surplus magnitudes into one historical distribution for deficit or surplus mode.

42. Use state-appropriate historical language.

### Deficit

> **The current trade deficit is [small/typical/large/very large] relative to historical U.S. trade deficits.**

### Surplus

> **The current trade surplus is [small/typical/large/very large] relative to historical U.S. trade surpluses.**

43. Use the established five-state classification framework.
44. Make clear that historical bands describe frequency, not whether a deficit or surplus is desirable.

## Captions and tooltip

45. Use separate captions for the band history and displayed period.

### Deficit example

> **Historical bands use quarterly U.S. trade-deficit magnitudes from [start]–[end]**

> **U.S. trade deficit as a share of GDP · Displayed: [start]–[end]**

### Surplus example

> **Historical bands use quarterly U.S. trade-surplus magnitudes from [start]–[end]**

> **U.S. trade surplus as a share of GDP · Displayed: [start]–[end]**

46. Use concise tooltip content.

### Deficit

> **2026 Q2**
> **Trade deficit** 2.7% of GDP

### Surplus

> **2026 Q2**
> **Trade surplus** 1.1% of GDP

47. Do not show the raw negative sign in deficit-mode compact tooltips.
48. Use a stable pointer cursor across the interactive chart area.
49. Preserve pointer, tap, keyboard, and accessible equivalents.
50. Provide an accessible summary explaining the active compact transformation.

## Default compact content

51. Keep only these items visible by default:

- hero magnitude;
- state label and date;
- plain-language dollars-per-$100 answer;
- historical classification;
- five-year direction;
- **Why this matters** control.

52. Do not show a long explanatory paragraph by default.

## Why this matters

53. Use the reusable disclosure pattern from Story 79.

54. In deficit mode, show:

> **A trade deficit is not automatically a sign of economic weakness. It can reflect strong U.S. demand and foreign willingness to invest in U.S. assets. But persistent deficits can expose some industries and regions to import competition and require continued foreign financing. A narrowing deficit can result from stronger exports or weaker imports, which have very different economic meanings.**

55. Add:

> **The United States does not simply “run out of money” because it imports more than it exports. The corresponding dollars generally return through foreign purchases of U.S. assets and financial claims. The long-run question is how the deficit is financed and whether the associated capital flows support productive investment or mainly consumption.**

56. In surplus mode, show:

> **A trade surplus is not automatically a sign of economic strength. It can reflect competitive exports and strong foreign demand, but it can also accompany weak domestic demand and subdued imports. The economic meaning depends on what is driving exports and imports.**

57. Keep the disclosure cautious and descriptive.
58. Do not frame trade as a national score or use “winning” and “losing” language.
59. Keep this disclosure independent from card-level **More**.

## Help content

60. Use the existing `?` help pattern for definitions and chart mechanics.

61. Use concise help:

> **The trade balance equals exports minus imports of goods and services. Negative signed values indicate a deficit; positive signed values indicate a surplus. The compact card shows the positive magnitude of the current state, while the expanded chart preserves the signed balance.**

62. Add:

> **Services include software, finance, consulting, transportation, travel, research, intellectual property, film, television, music, and other audiovisual services.**

63. Add:

> **Historical bands describe frequency, not a judgment that a deficit or surplus is inherently good or bad.**

64. Do not duplicate the full **Why this matters** interpretation in help.

## Expanded content under More

65. Preserve the full signed total trade-balance history.
66. In the expanded chart, deficits remain negative, surpluses positive, and zero separates the two.
67. Preserve existing 5-year, 10-year, 20-year, and maximum controls.
68. Add:

> **The compact chart shows the positive magnitude of the current trade state for easier reading. The expanded chart preserves the signed balance so deficits and surpluses can be compared across history.**

## Goods and services breakdown

69. Add a section titled:

> **What makes up the trade balance?**

70. Use authoritative compatible data for:

- goods balance;
- services balance;
- total goods-and-services balance.

71. Present all three as signed values.
72. Prefer aligned line charts or a selectable chart.
73. Do not use incompatible dual axes.
74. Explain:

> **The United States can run a large goods deficit while partly offsetting it with a services surplus.**

75. Clearly label frequency, units, and seasonal adjustment.
76. Preserve null gaps.

## Exports and imports separately

77. Add a section titled:

> **Is the balance changing because of exports or imports?**

78. Show exports and imports separately, preferably as shares of GDP.
79. Use compatible quarterly goods-and-services totals.
80. Let the reader distinguish:

- exports rising faster than imports;
- imports falling faster than exports;
- both rising;
- both falling.

81. Do not imply that a narrowing deficit is automatically healthy.

82. Add:

> **A narrowing deficit can result from stronger exports, weaker imports, or both. Those patterns have different economic meanings, so the balance alone cannot explain why the gap changed.**

83. Do not add causal attribution to tariffs, exchange rates, presidents, or trade agreements in this story.

## Data and refresh

84. Reuse the existing total-balance dataset where compatible.
85. Add authoritative goods, services, exports, and imports series through the existing browser-free refresh architecture.
86. Do not fetch provider data from the browser.
87. Validate exact-quarter alignment, units, seasonal adjustment, uniqueness, monotonic dates, signed-balance identities where definitions permit, null handling, and expected coverage.
88. Preserve prior valid committed data if refresh fails.
89. Update `docs/data-refresh.md` with source identifiers, transformations, sign conventions, compact magnitude logic, and component-series definitions.
90. Update `docs/product-overview.md` with the compact framing, goods-and-services coverage, **Why this matters**, and expanded component views.

## Acceptance criteria

1. The card remains on the main dashboard.
2. The question changes based on deficit, surplus, or approximately balanced state.
3. The compact hero is a nonnegative magnitude.
4. The card explicitly includes goods and services.
5. The plain-language answer uses dollars per $100 of GDP.
6. A state-appropriate historical classification is shown.
7. A five-year widened, narrowed, unchanged, or state-transition statement is shown.
8. The compact chart uses positive deficit or surplus magnitude.
9. Historical bands use only comparable historical states.
10. The compact tooltip does not show a negative sign in deficit mode.
11. The default compact view remains concise.
12. Longer context is behind **Why this matters**.
13. The expanded chart preserves the signed total balance.
14. The expanded view separates goods, services, and total balance.
15. The expanded view shows exports and imports separately.
16. Help explains service coverage and compact-versus-expanded sign treatment.
17. The card does not treat deficits as automatically bad or surpluses as automatically good.
18. No unrelated cards are changed.

## Verification

Add or update tests for:

- deficit, surplus, and approximately balanced questions;
- unsigned hero magnitude;
- dollars-per-$100 wording;
- deficit and surplus magnitude transformations;
- state-transition direction wording;
- deficit-only and surplus-only band inputs;
- historical classification;
- concise tooltip fields;
- stable cursor;
- accessible transformation summary;
- **Why this matters** state-specific content;
- signed expanded chart preservation;
- goods/services/total rendering;
- exports/imports rendering;
- source validation and refresh-failure behavior;
- responsive layouts.

Run:

```bash
npm run verify
git diff --check
```

Also manually verify the current deficit fixture, surplus fixture, near-zero fixture, transitions between surplus and deficit, compact and expanded layouts, pointer/tap/keyboard interaction, and goods/services/total reconciliation.

## Out of scope

- Tariff-policy attribution.
- Presidential-policy evaluation.
- Bilateral country trade balances.
- Industry-level trade breakdowns.
- Current-account balance beyond goods and services.
- Foreign-asset ownership charts.
- Exchange-rate modeling.
- Changes to unrelated cards.
