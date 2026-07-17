# Issue Catch-all

Don't use this document. This is simply a place where devs and designers can add ideas or issues that we may or may not address.

## Making sense of each card

**Is economic output growing faster than the population?**
If the number is above zero, then yes, it is.

- We should show the answer, "yes" or "no"
- We should put it in context, e.g. 2.3% is about average for a good year
  2.3%
  Latest real GDP per capita growth
  Above typical — higher than 68% of observations in the selected 20-year period

Make a compact percentile strip directly beneath it. This could eventually become a shared contextual component for every card, with indicator-specific directionality controlling whether “higher” is favorable, unfavorable, or neutral.

_note_ We should use a component that can handle different contexts. A high GDP is "good" but a high unemployment rate is "bad." If we want to use this component in both cards, it needs to know what good/bad mean.

Lower historically Higher historically
|---------------------------------------------------------------|
▲
2.3%
68th percentile

## How quickly is payroll employment growing?

Adding 100,000 jobs when total payroll employment is 130 million is more meaningful than adding 100,000 when payroll employment is 159 million. FRED’s PAYEMS series is a level measured in thousands of payroll jobs, and the dashboard is currently deriving monthly changes from that level. The underlying BLS establishment survey is designed to estimate the number of payroll jobs, hours, and earnings, so the headline monthly change is naturally reported as a count of jobs.

Primary measure: three-month annualized payroll growth
Unit: percent

That second card would use the existing PAYEMS level:

(
payroll level three months earlier
payroll level now
​

)
4
−1

The advantages are:

comparable across decades
less affected by the growing size of the labor market
conceptually consistent with other growth-rate cards
no need for population data or a mismatched per-capita denominator
both views remain visible simultaneously

The disadvantage is some redundancy: both cards derive from PAYEMS and will show broadly similar turning points. But the distinction is analytically legitimate enough to justify two cards, particularly because the absolute-change card is useful for understanding monthly news while the percentage card is better for historical comparison.

This should be a refinement to the Employment section. It could either replace the currently planned “labor-force participation or initial claims” slot, or be considered during the Phase 1 closeout when we review whether the labor section has the right balance. My initial preference is not to replace claims or participation automatically, because normalized payroll growth does not provide the same leading information.
