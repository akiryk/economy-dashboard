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
