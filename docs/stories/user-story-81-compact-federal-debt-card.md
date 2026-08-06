# User Story 81 — Compact the federal debt held by the public card

## User story

As a dashboard reader, I want to understand how large federal debt held by the public is relative to the economy and why that matters, so that I can recognize the current fiscal vulnerability without mistaking the ratio for an imminent crisis signal.

## Objective

Convert the existing federal-debt card to the compact-card pattern while preserving the full research view under **More**.

Keep the current question:

> **How large is federal debt held by the public relative to the economy?**

The compact card should show the latest debt-to-GDP ratio, translate it into plain language, classify it against postwar history, show recent direction, and keep longer interpretation behind **Why this matters**.

Do not frame the ratio as a bankruptcy, default, hyperinflation, or imminent-crisis indicator.

## Requirements

### Scope and definition

1. Keep the card in the **Federal Debt** section on the main dashboard.
2. Preserve the existing quarterly source series and metadata.
3. Define the measure as federal debt held outside federal government accounts, scaled by GDP.
4. Explain that “held by the public” includes Treasury securities held by domestic and foreign investors, financial institutions, state and local governments, and the Federal Reserve.
5. Explain that it generally excludes debt held inside federal government accounts, such as many trust-fund holdings.
6. Make clear that this is accumulated debt, while the annual deficit measures new borrowing during one year.

### Hero and direct answer

7. Show the latest ratio prominently.

   Example:

   > **98.7% of GDP**

8. Use the hero label:

   > **Federal debt held by the public**

9. Show the latest quarter.

10. Add the plain-language answer:

> **Federal debt held by the public is approximately equal to one year of U.S. economic output.**

11. Derive that wording deterministically from the unrounded ratio:

   - below 50%: **less than half of one year of economic output**
   - 50% to below 90%: **more than half, but less than one year of economic output**
   - 90% to 110%: **approximately equal to one year of economic output**
   - above 110%: **greater than one year of economic output**

12. Do not imply that GDP is money available to repay the debt or that the debt must be repaid within one year.

### Historical position

13. Add a deterministic five-state classification:

   - very low;
   - low;
   - typical;
   - high;
   - very high.

14. Use compatible postwar history for the distribution.
15. Suggested wording:

> **The debt ratio is very high by postwar standards.**

16. Make clear that historical bands describe frequency, not a safe range, target, or crisis threshold.

### Recent direction

17. Add one visible sentence comparing the latest ratio with five years earlier.

   - rising: **The ratio has risen by [X] percentage points over the past five years.**
   - falling: **The ratio has fallen by [X] percentage points over the past five years.**
   - approximately unchanged: **The ratio is little changed from five years ago.**

18. Use the project’s existing neutral convention. If none exists, treat an absolute change below 1.0 percentage point as approximately unchanged.

### Compact chart

19. Use the established compact chart pattern:

   - latest five years of quarterly observations;
   - middle-50% and middle-80% postwar historical bands;
   - latest marker;
   - visible start and end quarters;
   - pointer, tap, and keyboard details.

20. Do not show a zero line or force the axis to zero.
21. Preserve all valid quarterly points and null gaps.
22. Do not interpolate or carry values forward.
23. Tooltip details should show only quarter and debt as percent of GDP.
24. Provide an accessible summary with the latest ratio, plain-language comparison, historical state, five-year direction, and chart period.

### Default compact content

25. Keep only these items visible by default:

   - hero value;
   - hero label and date;
   - plain-language answer;
   - historical classification;
   - five-year direction;
   - **Why this matters** control.

26. Do not show a long paragraph by default.

### Why this matters

27. Use the reusable disclosure pattern from Story 79.
28. Default label:

   > **Why this matters**

29. Expanded label:

   > **Hide context**

30. When expanded, show:

> **A high debt ratio does not identify a precise crisis threshold. Its main significance is that higher interest rates become more costly, more of the federal budget may go toward servicing past borrowing, and the government has less fiscal flexibility during future recessions or emergencies. The risk is greater when debt continues rising faster than the economy.**

31. Add:

> **The United States has unusual advantages, including borrowing in its own currency and deep demand for Treasury securities. Those advantages reduce immediate crisis risk, but they do not eliminate the long-run costs of persistently rising debt.**

32. Do not mention Weimar Germany or make collapse analogies.
33. Do not say default, insolvency, or hyperinflation is imminent.
34. Keep the disclosure independent from card-level **More**.

### Help content

35. Use the existing `?` help pattern for definitions and chart mechanics.
36. Use concise help:

> **Debt held by the public includes Treasury securities held outside federal government accounts, including holdings of investors, financial institutions, foreign governments, state and local governments, and the Federal Reserve. It excludes most debt held by federal trust funds. The ratio compares accumulated debt with annual GDP so different periods can be compared more meaningfully.**

37. Add:

> **The historical bands describe frequency, not a safe or recommended range.**

38. Do not duplicate the full **Why this matters** text.

### Expanded content under More

39. Preserve the existing full research view, including full history, range controls, exact details, recent observations, source attribution, methodology, and limitations.

40. Add or retain:

#### What this tells you

> **This measure shows the accumulated federal debt held outside federal government accounts relative to the size of the economy.**

#### Why it matters

> **High and rising debt increases sensitivity to interest rates and can reduce future fiscal flexibility. Over time, sustained debt growth may also increase borrowing costs and restrain private investment.**

#### What this leaves out

> **The ratio does not identify a precise crisis threshold, measure the current interest burden, show the maturity structure of the debt, or determine whether past borrowing financed productive uses.**

41. Add a **Consider alongside** reference to the federal deficit, federal net interest expense if available, and economic growth.
42. Do not add a new interest-expense chart in this story.

### Documentation

43. Reuse the existing committed dataset and browser-free refresh architecture.
44. Preserve prior valid data if refresh fails.
45. Update `docs/product-overview.md` with the compact framing, debt-versus-deficit distinction, historical state, direction statement, and role of **Why this matters**.
46. Update `docs/data-refresh.md` only if source or transformation behavior changes.

## Acceptance criteria

1. The card remains on the main dashboard.
2. The question remains unchanged.
3. The hero shows the latest debt-to-GDP ratio.
4. The ratio is translated into a one-year-of-output comparison.
5. A five-state postwar historical classification is shown.
6. A five-year rising, falling, or unchanged statement is shown.
7. The compact chart shows five years of quarterly observations with historical bands and a latest marker.
8. No zero line is shown.
9. The default compact view remains concise.
10. Longer explanation is behind **Why this matters**.
11. Help explains the metric and bands without duplicating interpretation.
12. The expanded research view remains intact.
13. The card clearly distinguishes debt from the annual deficit.
14. The card does not imply an imminent crisis or universal danger threshold.
15. No unrelated cards are changed.

## Verification

Add or update tests for:

- hero formatting;
- one-year-of-output wording bands;
- all five historical states;
- five-year rising, falling, and unchanged states;
- historical-band calculation;
- absence of a zero line;
- latest marker;
- tooltip fields;
- accessible summary;
- **Why this matters** disclosure;
- inverse disclosure label;
- independence from card-level **More**;
- responsive layouts.

Run:

```bash
npm run verify
git diff --check
```

Also manually verify the latest source observation, five-year direction calculation, full-history rendering, desktop and narrow layouts, and pointer, tap, and keyboard interactions.

## Out of scope

- Federal net interest expense.
- Debt-service-to-revenue analysis.
- Gross federal debt.
- Debt maturity or ownership breakdowns.
- Fiscal-sustainability modeling.
- Crisis probability or default forecasting.
- Changes to unrelated cards.
