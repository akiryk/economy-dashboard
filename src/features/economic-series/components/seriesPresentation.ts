import type { EconomicValueFormat } from "../utils/economicSeries";

interface EconomicSeriesPresentation {
  topicLabel: string;
  latestValueLabel: string;
  whatThisTellsYou: string;
  whatThisLeavesOut: string;
  relatedIndicators: readonly string[];
  recentObservationCount: number;
  recentObservationsCaption: string;
  valueColumnLabel: string;
  includeZeroInChart: boolean;
  reportBelowZero: boolean;
  valueFormat: EconomicValueFormat;
  summaryFormat: "numeric-range" | "job-change";
  recentTable: "single-value" | "payroll-changes";
}

const presentations: Readonly<Record<string, EconomicSeriesPresentation>> = {
  "trade-balance-share-of-gdp": {
    topicLabel: "Trade flows",
    latestValueLabel: "Latest net exports share of GDP",
    whatThisTellsYou:
      "Net exports equal exports minus imports of goods and services. Negative values mean imports exceeded exports; positive values mean exports exceeded imports. Expressing the balance relative to GDP supports historical comparison.",
    whatThisLeavesOut:
      "A trade deficit is not automatically evidence of weakness, and a surplus is not automatically evidence of strength. Exports, imports, domestic and foreign demand, prices, exchange rates, and other factors can move the balance.",
    relatedIndicators: [
      "Economic growth",
      "Effective tariff burden",
      "Exchange rates",
    ],
    recentObservationCount: 8,
    recentObservationsCaption:
      "Eight most recent net-exports-share observations",
    valueColumnLabel: "Net exports, percent of GDP",
    includeZeroInChart: true,
    reportBelowZero: true,
    valueFormat: "signed-percentage",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
  "effective-tariff-burden": {
    topicLabel: "Tariffs",
    latestValueLabel: "Latest effective tariff burden",
    whatThisTellsYou:
      "This ratio divides federal customs-duty receipts by imports of goods. Both inputs are quarterly seasonally adjusted annual rates from the BEA national accounts. It is an average effective customs-duty burden, not a statutory tariff schedule.",
    whatThisLeavesOut:
      "The ratio can change with collections, import composition and value, exemptions, timing, or policy. It does not show rates for every product or country, identify who bears the economic cost, or describe nontariff barriers.",
    relatedIndicators: ["Trade balance", "Imports", "Inflation"],
    recentObservationCount: 8,
    recentObservationsCaption:
      "Eight most recent effective tariff-burden observations",
    valueColumnLabel: "Effective tariff burden",
    includeZeroInChart: true,
    reportBelowZero: false,
    valueFormat: "percentage",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
  "federal-budget-balance": {
    topicLabel: "Federal budget balance",
    latestValueLabel: "Latest federal budget balance",
    whatThisTellsYou:
      "This measure shows whether federal spending exceeded revenue or vice versa, relative to the size of the economy.",
    whatThisLeavesOut:
      "The measure does not show why the deficit changed, whether the borrowing financed productive uses, how much debt has accumulated, or whether the current fiscal stance is appropriate for the economic cycle.",
    relatedIndicators: [
      "Debt held by the public",
      "Interest rates",
      "Economic growth",
    ],
    recentObservationCount: 10,
    recentObservationsCaption:
      "Ten most recent federal budget-balance observations",
    valueColumnLabel: "Federal budget balance, percent of GDP",
    includeZeroInChart: true,
    reportBelowZero: true,
    valueFormat: "signed-percentage",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
  "federal-debt-held-by-public": {
    topicLabel: "Federal debt",
    latestValueLabel: "Latest federal debt held by the public",
    whatThisTellsYou:
      "This measure shows the accumulated federal debt held outside federal government accounts relative to the size of the economy.",
    whatThisLeavesOut:
      "The ratio does not identify a precise crisis threshold, measure the current interest burden, show the maturity structure of the debt, or determine whether past borrowing financed productive uses.",
    relatedIndicators: [
      "Federal deficit",
      "Federal net interest expense",
      "Economic growth",
    ],
    recentObservationCount: 8,
    recentObservationsCaption:
      "Eight most recent federal debt-held-by-the-public observations",
    valueColumnLabel: "Federal debt held by the public, percent of GDP",
    includeZeroInChart: false,
    reportBelowZero: false,
    valueFormat: "percentage",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
  "broad-credit-conditions": {
    topicLabel: "Credit conditions",
    latestValueLabel: "Latest broad credit-conditions index",
    whatThisTellsYou:
      "The Chicago Fed credit subindex combines multiple credit-related measures relative to their historical averages. Zero is approximately average, positive values indicate tighter-than-average conditions, and negative values indicate looser-than-average conditions. It covers broad credit conditions rather than only corporate bonds.",
    whatThisLeavesOut:
      "This standardized composite is not a percentage, borrowing-rate spread, or directly observed price. It does not mean every household, bank, or business faces the same conditions, and its methodology and component relationships may evolve with source revisions.",
    relatedIndicators: [
      "Interest rates",
      "Business investment",
      "Household debt service",
    ],
    recentObservationCount: 12,
    recentObservationsCaption:
      "Twelve most recent broad credit-conditions observations",
    valueColumnLabel: "Credit-conditions index",
    includeZeroInChart: true,
    reportBelowZero: true,
    valueFormat: "credit-index",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
  "bank-lending-standards": {
    topicLabel: "Bank credit availability",
    latestValueLabel: "Latest bank lending standards",
    whatThisTellsYou:
      "The Senior Loan Officer Opinion Survey asks whether banks tightened or eased lending standards over the survey period. This card shows the net percentage of domestic banks reporting tighter standards for commercial and industrial loans to large and middle-market firms. Positive values indicate net tightening; negative values indicate net easing. Tighter standards may restrict credit availability and can signal caution among lenders.",
    whatThisLeavesOut:
      "This survey measure is not a denial rate, loan volume, borrowing cost, or census of lending. It omits loan demand and every other borrower and loan category. A positive value does not mean every bank tightened. The respondent sample, questions, and reporting convention may evolve, and survey responses and economic outcomes may move at different times.",
    relatedIndicators: [
      "Broad credit conditions",
      "Interest rates",
      "Business investment",
      "Corporate profits",
    ],
    recentObservationCount: 8,
    recentObservationsCaption:
      "Eight most recent bank lending-standards observations",
    valueColumnLabel: "Net percent reporting tighter standards",
    includeZeroInChart: true,
    reportBelowZero: true,
    valueFormat: "signed-percentage",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
  "real-business-investment-growth": {
    topicLabel: "Business investment",
    latestValueLabel: "Latest real business investment growth",
    whatThisTellsYou:
      "This series shows how inflation-adjusted private business spending on nonresidential structures, equipment, and intellectual-property products changed from the same quarter one year earlier. A positive rate means the real investment flow is still rising; a falling positive rate means it is rising more slowly. This is productive-asset spending, not purchases of stocks, bonds, or other financial assets.",
    whatThisLeavesOut:
      "The measure is a flow of investment spending rather than the total stock of productive assets. It excludes housing and government investment, can conceal differences among industries and investment categories, and does not identify why investment strengthened or weakened.",
    relatedIndicators: [
      "Manufacturing output",
      "Capacity utilization",
      "Productivity",
    ],
    recentObservationCount: 8,
    recentObservationsCaption:
      "Eight most recent real business investment growth observations",
    valueColumnLabel: "Year-over-year real investment growth",
    includeZeroInChart: true,
    reportBelowZero: true,
    valueFormat: "percentage",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
  "corporate-profit-share": {
    topicLabel: "Corporate profitability",
    latestValueLabel: "Latest after-tax corporate profit share",
    whatThisTellsYou:
      "This card divides adjusted after-tax corporate profits by nominal GDP. Scaling profits to the economy makes periods more comparable than raw dollar totals. Inventory valuation and capital consumption adjustments are intended to better represent profits from current production. A rising share means adjusted after-tax profits increased relative to GDP; a falling share means the share was compressed relative to GDP.",
    whatThisLeavesOut:
      "This national-accounts measure is not a company revenue margin, S&P 500 margin, earnings per share, expected earnings, equity valuation, investment signal, or household-welfare measure. It includes corporations beyond publicly traded U.S. companies and conceals industry and company differences. Prices, wages, productivity, taxes, interest costs, sector composition, and other factors can affect the ratio; the card does not assign causation or measure the labor-versus-capital income split.",
    relatedIndicators: [
      "Business investment",
      "Capacity utilization",
      "Bank lending standards",
      "Wages",
      "Labor share of income",
    ],
    recentObservationCount: 8,
    recentObservationsCaption:
      "Eight most recent corporate profit-share observations",
    valueColumnLabel: "After-tax corporate profit share of GDP",
    includeZeroInChart: false,
    reportBelowZero: false,
    valueFormat: "percentage",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
  "industrial-capacity-utilization": {
    topicLabel: "Industrial activity",
    latestValueLabel: "Latest industrial capacity utilization",
    whatThisTellsYou:
      "Capacity utilization compares current industrial production with the Federal Reserve’s estimate of the maximum output that factories, mines, and electric and gas utilities could sustain under realistic operating conditions. A lower rate means more estimated spare industrial capacity; a higher rate means less.",
    whatThisLeavesOut:
      "The measure covers the industrial sector rather than the whole economy. Low utilization can reflect weak demand or newly added capacity. High utilization can reflect strong demand, bottlenecks, or price pressure. No particular rate is automatically good or bad, and the measure does not directly show business investment or explain why utilization changed.",
    relatedIndicators: [
      "Manufacturing output",
      "Business investment",
      "Inflation",
    ],
    recentObservationCount: 12,
    recentObservationsCaption:
      "Twelve most recent industrial capacity-utilization observations",
    valueColumnLabel: "Capacity utilization",
    includeZeroInChart: false,
    reportBelowZero: false,
    valueFormat: "percentage",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
  "home-ownership-cost-share": {
    topicLabel: "Housing affordability",
    latestValueLabel: "Latest estimated share of median household income needed to own the median-priced home",
    whatThisTellsYou:
      "The Atlanta Fed models the annual cost for a median-income household to purchase a median-priced home, including principal and interest on a 30-year fixed-rate mortgage with a 10% down payment, property taxes, homeowners insurance, and private mortgage insurance. The median price is a monthly three-month moving average; median household income is based on Census ACS estimates. A higher percentage means modeled ownership costs consume more median household income.",
    whatThisLeavesOut:
      "This national model does not describe local markets, current homeowners with older mortgages, or every buyer’s down payment, credit profile, taxes, or insurance. It is not a count of households that can or cannot buy a home.",
    relatedIndicators: [
      "Housing starts",
      "Household debt service",
      "Real income",
    ],
    recentObservationCount: 12,
    recentObservationsCaption:
      "Twelve most recent national home-ownership cost-share observations",
    valueColumnLabel: "Annual ownership cost share",
    includeZeroInChart: false,
    reportBelowZero: false,
    valueFormat: "percentage",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
  "housing-starts": {
    topicLabel: "Housing construction",
    latestValueLabel: "Three-month average annualized pace",
    whatThisTellsYou:
      "Housing starts measure the annualized pace at which privately owned housing units begin construction. The compact headline smooths that raw monthly pace with a three-month average, while the population-normalized view divides each exact month by that month’s U.S. population estimate. Excavation for a multifamily building counts every unit in that building as started.",
    whatThisLeavesOut:
      "A start is not a completion or an occupied home. The annualized pace is not the literal number started in a month or a forecast of completed annual supply, and population normalization does not establish whether construction is adequate for household formation, replacement needs, vacancies, affordability, or an existing housing shortage.",
    relatedIndicators: [
      "Home-ownership affordability",
      "Residential investment",
      "Construction employment",
    ],
    recentObservationCount: 12,
    recentObservationsCaption: "Twelve most recent housing-starts observations",
    valueColumnLabel: "Thousands of units, annual rate",
    includeZeroInChart: false,
    reportBelowZero: false,
    valueFormat: "thousands-units",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
  "household-debt-service-ratio": {
    topicLabel: "Household debt burden",
    latestValueLabel: "Latest household debt-service ratio",
    whatThisTellsYou:
      "The household debt-service ratio estimates required mortgage and consumer-debt payments as a share of aggregate disposable personal income. It shows how much of total after-tax household income is committed to required debt payments.",
    whatThisLeavesOut:
      "This is an aggregate ratio, not the share paid by a typical household and not a complete measure of financial hardship. Debt burdens can differ sharply across households, and the ratio does not show delinquency, debt balances, assets, or access to credit.",
    relatedIndicators: [
      "Real income and spending",
      "Personal saving rate",
      "Housing costs",
    ],
    recentObservationCount: 8,
    recentObservationsCaption:
      "Eight most recent household debt-service ratio observations",
    valueColumnLabel: "Debt-service ratio",
    includeZeroInChart: false,
    reportBelowZero: false,
    valueFormat: "percentage",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
  "personal-saving-rate": {
    topicLabel: "Household saving",
    latestValueLabel: "Latest personal saving rate",
    whatThisTellsYou:
      "The personal saving rate is the share of aggregate disposable personal income that remains after personal consumption and related outlays. It helps show how much current income households are saving rather than spending.",
    whatThisLeavesOut:
      "The national rate is an aggregate and can differ sharply across households. It does not measure total household wealth, cash balances, or debt, and a higher rate can reflect either improved financial capacity or greater caution.",
    relatedIndicators: [
      "Real income and spending",
      "Household debt service",
      "Consumer confidence",
    ],
    recentObservationCount: 12,
    recentObservationsCaption:
      "Twelve most recent personal saving rate observations",
    valueColumnLabel: "Personal saving rate",
    includeZeroInChart: false,
    reportBelowZero: false,
    valueFormat: "percentage",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
  "real-gdp-growth": {
    topicLabel: "Economic growth",
    latestValueLabel: "Latest real GDP growth",
    whatThisTellsYou:
      "Real GDP measures the inflation-adjusted value of goods and services produced in the United States. Year-over-year growth compares output with the same period one year earlier.",
    whatThisLeavesOut:
      "Total GDP growth does not show how gains are distributed, whether GDP per person is rising, or whether typical households are financially better off.",
    relatedIndicators: ["Productivity", "Employment", "Real income"],
    recentObservationCount: 8,
    recentObservationsCaption: "Eight most recent real GDP growth observations",
    valueColumnLabel: "Year-over-year growth",
    includeZeroInChart: true,
    reportBelowZero: true,
    valueFormat: "percentage",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
  "real-gdp-per-capita-growth": {
    topicLabel: "Growth per person",
    latestValueLabel: "Latest real GDP per capita growth",
    whatThisTellsYou:
      "Real GDP is the inflation-adjusted size of the economic “pie.” Real GDP per capita divides that pie by the population to estimate the average slice per person. If real GDP per capita is growing, the pie is expanding faster than the number of people sharing it, so the average slice is getting larger. If it is falling, population is growing faster than the pie, so the average slice is getting smaller.",
    whatThisLeavesOut:
      "Per-capita GDP is an average and does not show how income or output is distributed. It also does not directly measure household well-being, unpaid work, environmental costs, or the quality of public services.",
    relatedIndicators: ["Real GDP growth", "Productivity", "Real income"],
    recentObservationCount: 8,
    recentObservationsCaption:
      "Eight most recent real GDP per capita growth observations",
    valueColumnLabel: "Year-over-year growth",
    includeZeroInChart: true,
    reportBelowZero: true,
    valueFormat: "percentage",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
  "labor-productivity-growth": {
    topicLabel: "Productivity growth",
    latestValueLabel: "Productivity is higher than a year ago",
    whatThisTellsYou:
      "Labor productivity measures output per hour worked. This chart shows how quickly productivity is changing from a year earlier. A positive value means output per hour is still increasing. A rising line means those gains are accelerating, while a falling line means they are slowing. A downward-moving line above zero does not mean productivity is falling; it means productivity is still increasing, but at a slower rate.",
    whatThisLeavesOut:
      "Short-term productivity growth is volatile because output and hours can change at different speeds during recessions, recoveries, and major disruptions. Technological and organizational improvements matter, but their long-run effect is easier to see in the productivity-level card.",
    relatedIndicators: ["Real GDP", "Real wages", "Labor share"],
    recentObservationCount: 8,
    recentObservationsCaption:
      "Eight most recent productivity growth momentum observations",
    valueColumnLabel: "Year-over-year growth",
    includeZeroInChart: true,
    reportBelowZero: true,
    valueFormat: "percentage",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
  "headline-cpi-inflation": {
    topicLabel: "Inflation",
    latestValueLabel: "Latest CPI inflation",
    whatThisTellsYou:
      "Headline CPI inflation measures how much the prices paid by urban consumers for a broad basket of goods and services have changed compared with the same month one year earlier.",
    whatThisLeavesOut:
      "The national average does not describe every household’s personal inflation rate. It also does not show whether prices are falling; a lower positive inflation rate means prices are generally rising more slowly, not returning to their previous level.",
    relatedIndicators: ["Wage growth", "Core inflation", "Consumer spending"],
    recentObservationCount: 12,
    recentObservationsCaption:
      "Twelve most recent headline CPI inflation observations",
    valueColumnLabel: "Year-over-year inflation",
    includeZeroInChart: true,
    reportBelowZero: true,
    valueFormat: "percentage",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
  "unemployment-rate": {
    topicLabel: "Labor market",
    latestValueLabel: "Latest unemployment rate",
    whatThisTellsYou:
      "The unemployment rate measures the share of the labor force that does not have a job and is actively looking for work.",
    whatThisLeavesOut:
      "People who are not working and are not actively searching are not counted as unemployed. The rate also does not show job quality, wage growth, hours worked, or how conditions differ across groups.",
    relatedIndicators: [
      "Prime-age employment",
      "Payroll growth",
      "Wage growth",
    ],
    recentObservationCount: 12,
    recentObservationsCaption:
      "Twelve most recent unemployment rate observations",
    valueColumnLabel: "Unemployment rate",
    includeZeroInChart: false,
    reportBelowZero: false,
    valueFormat: "percentage",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
  "prime-age-employment-ratio": {
    topicLabel: "Labor market",
    latestValueLabel: "Latest prime-age employment ratio",
    whatThisTellsYou:
      "The prime-age employment-to-population ratio measures the share of adults ages 25 through 54 who are employed. It is less affected by retirement and schooling than an all-ages employment measure.",
    whatThisLeavesOut:
      "The ratio does not show whether people want more hours, whether jobs are well paid, or why someone is not employed. It also does not describe conditions for younger or older workers.",
    relatedIndicators: [
      "Unemployment",
      "Labor-force participation",
      "Payroll growth",
    ],
    recentObservationCount: 12,
    recentObservationsCaption:
      "Twelve most recent prime-age employment ratio observations",
    valueColumnLabel: "Prime-age employment ratio",
    includeZeroInChart: false,
    reportBelowZero: false,
    valueFormat: "percentage",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
  "payroll-growth": {
    topicLabel: "Labor market",
    latestValueLabel: "Latest 3-month average",
    whatThisTellsYou:
      "Payroll growth measures the net change in jobs reported by U.S. employers. The three-month average reduces some of the volatility in any single monthly estimate while remaining responsive to changes in hiring.",
    whatThisLeavesOut:
      "Payroll growth does not show the unemployment rate, how many people are entering or leaving the labor force, whether workers are receiving more hours or higher pay, or how job gains are distributed across industries. Recent estimates are also subject to revision.",
    relatedIndicators: ["Unemployment", "Prime-age employment", "Wage growth"],
    recentObservationCount: 12,
    recentObservationsCaption:
      "Twelve most recent monthly payroll changes and three-month averages",
    valueColumnLabel: "Three-month average",
    includeZeroInChart: true,
    reportBelowZero: true,
    valueFormat: "signed-thousands",
    summaryFormat: "job-change",
    recentTable: "payroll-changes",
  },
  "manufacturing-output": {
    topicLabel: "Business and manufacturing",
    latestValueLabel: "Change in inflation-adjusted manufacturing production from a year earlier",
    whatThisTellsYou:
      "This measure shows whether U.S. manufacturers are collectively producing more or fewer goods than a year earlier after removing the effect of price changes. It reflects the volume of production, not the number of workers used or the dollar value received for what was produced.",
    whatThisLeavesOut:
      "The measure does not show manufacturing employment, productivity, profitability, prices, capacity utilization, industry composition, trade exposure, or manufacturing’s share of the overall economy.",
    relatedIndicators: [
      "Manufacturing output versus employment (Secondary indicators)",
      "Labor productivity",
      "Real business investment",
    ],
    recentObservationCount: 12,
    recentObservationsCaption: "Twelve most recent manufacturing-output index observations",
    valueColumnLabel: "Manufacturing production index",
    includeZeroInChart: false,
    reportBelowZero: false,
    valueFormat: "index",
    summaryFormat: "numeric-range",
    recentTable: "single-value",
  },
};

export function getEconomicSeriesPresentation(
  slug: string,
): EconomicSeriesPresentation {
  const presentation = presentations[slug];
  if (!presentation) {
    throw new Error(`Missing presentation configuration for series: ${slug}`);
  }
  return presentation;
}
