import type { EconomicFrequency } from '../models/economicSeries'
import {
  formatObservationPeriod,
  formatPercentage,
  formatSignedPercentage,
  formatSignedThousands,
} from './economicSeries'
import {
  classifyHistoricalBandPosition,
  type HistoricalBandDefinition,
  type HistoricalBandModel,
  type HistoricalBandPosition,
} from './historicalBandContext'
import { classifyCpiAssessment, formatCpiAssessment } from './cpiData'
import {
  createHomeOwnershipAccessibleSummary,
  formatHomeOwnershipHistoricalPosition,
  homeOwnershipAffordabilityThreshold,
} from './homeOwnershipAffordability'
import type { BudgetBalanceState } from './budgetBalanceContext'
import { formatBudgetBalanceStateLabel } from './budgetBalanceContext'

export interface HistoricalBandHelpText {
  heading: string
  description: string
}

export interface CompactHistoricalMetricDefinition {
  seriesLabel: string
  frequency: EconomicFrequency
  historicalBands: HistoricalBandDefinition
  showZeroLine: boolean
  showLatestMarker: boolean
  showAllObservationMarkers?: boolean
  interactiveDetails?: boolean
  interactiveCursor?: 'crosshair' | 'pointer'
  unifiedFooterLabels?: boolean
  displayedPeriodPrefix?: string
  interactionStateLabel?: (value: number | null) => string
  pointComparison?: {
    months: number
    label: string
  }
  pointThreshold?: { value: number; label: string; differenceLabel: string }
  valueFormatter?: (value: number | null) => string
  referenceLines?: readonly { value: number; label: string }[]
  showReferenceLineLabels?: boolean
  helpText: HistoricalBandHelpText
  zeroLineMeaning: string
  positionDescriptions: Readonly<
    Record<Exclude<HistoricalBandPosition, 'unavailable'>, string>
  >
  accessibleSummarySuffix?: (model: HistoricalBandModel) => string
  accessibleSummary?: (model: HistoricalBandModel) => string
  comparisonLabel?: (model: HistoricalBandModel) => string
}

const sharedBandHelp: HistoricalBandHelpText = {
  heading: 'Recent historical comparison: past 25 years',
  description:
    'The dark band shows the middle 50% of readings during this period. The lighter bands extend the range to the middle 80%. Readings outside the shaded area fall within the highest or lowest 10% of the comparison period.',
}

const gdpPositionDescriptions: CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'below the historical 10th percentile',
  betweenOuterAndInnerLow: 'between the historical 10th and 25th percentiles',
  insideInnerBand: 'within the historical middle 50%',
  betweenInnerAndOuterHigh: 'between the historical 75th and 90th percentiles',
  aboveOuterBand: 'above the historical 90th percentile',
}

const perCapitaPositionDescriptions: CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'below the historical 10th percentile',
  betweenOuterAndInnerLow: 'between the historical 10th and 25th percentiles',
  insideInnerBand: 'within the historical middle 50%',
  betweenInnerAndOuterHigh: 'between the historical 75th and 90th percentiles',
  aboveOuterBand: 'above the historical 90th percentile',
}

const productivityPositionDescriptions: CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'below the historical 10th percentile',
  betweenOuterAndInnerLow: 'between the historical 10th and 25th percentiles',
  insideInnerBand: 'within the historical middle 50%',
  betweenInnerAndOuterHigh: 'between the historical 75th and 90th percentiles',
  aboveOuterBand: 'above the historical 90th percentile',
}

const cpiPositionDescriptions: CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'below the historical 10th percentile',
  betweenOuterAndInnerLow: 'between the historical 10th and 25th percentiles',
  insideInnerBand: 'within the historical middle 50%',
  betweenInnerAndOuterHigh: 'between the historical 75th and 90th percentiles',
  aboveOuterBand: 'above the historical 90th percentile',
}

const unemploymentPositionDescriptions:
CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'very low compared with the past 25 years',
  betweenOuterAndInnerLow: 'low compared with the past 25 years',
  insideInnerBand: 'near its typical range of the past 25 years',
  betweenInnerAndOuterHigh: 'high compared with the past 25 years',
  aboveOuterBand: 'very high compared with the past 25 years',
}

const primeAgeEmploymentPositionDescriptions:
CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'very low compared with the past 25 years',
  betweenOuterAndInnerLow: 'low compared with the past 25 years',
  insideInnerBand: 'near its typical range of the past 25 years',
  betweenInnerAndOuterHigh: 'high compared with the past 25 years',
  aboveOuterBand: 'very high compared with the past 25 years',
}

const payrollGrowthPositionDescriptions:
CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'very weak by historical standards',
  betweenOuterAndInnerLow: 'somewhat weak by historical standards',
  insideInnerBand: 'within the typical historical range',
  betweenInnerAndOuterHigh: 'strong by historical standards',
  aboveOuterBand: 'very strong by historical standards',
}

const savingRatePositionDescriptions:
CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'very low by historical standards',
  betweenOuterAndInnerLow: 'low by historical standards',
  insideInnerBand: 'within its typical historical range',
  betweenInnerAndOuterHigh: 'high by historical standards',
  aboveOuterBand: 'very high by historical standards',
}

const homeOwnershipPositionDescriptions:
CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'very low compared with the available history',
  betweenOuterAndInnerLow: 'low compared with the available history',
  insideInnerBand: 'typical compared with the available history',
  betweenInnerAndOuterHigh: 'high compared with the available history',
  aboveOuterBand: 'very high compared with the available history',
}

const housingStartsPositionDescriptions:
CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'very low by historical standards',
  betweenOuterAndInnerLow: 'low by historical standards',
  insideInnerBand: 'typical by historical standards',
  betweenInnerAndOuterHigh: 'high by historical standards',
  aboveOuterBand: 'very high by historical standards',
}

const manufacturingOutputPositionDescriptions:
CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'very weak by the standards of the past 25 years',
  betweenOuterAndInnerLow: 'weak by the standards of the past 25 years',
  insideInnerBand: 'typical by the standards of the past 25 years',
  betweenInnerAndOuterHigh: 'strong by the standards of the past 25 years',
  aboveOuterBand: 'very strong by the standards of the past 25 years',
}

const businessInvestmentPositionDescriptions: CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'very weak relative to the available history',
  betweenOuterAndInnerLow: 'weak relative to the available history',
  insideInnerBand: 'typical relative to the available history',
  betweenInnerAndOuterHigh: 'strong relative to the available history',
  aboveOuterBand: 'very strong relative to the available history',
}

const corporateProfitSharePositionDescriptions: CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'very low by the standards of the past 25 years',
  betweenOuterAndInnerLow: 'low by the standards of the past 25 years',
  insideInnerBand: 'typical by the standards of the past 25 years',
  betweenInnerAndOuterHigh: 'high by the standards of the past 25 years',
  aboveOuterBand: 'very high by the standards of the past 25 years',
}

const budgetBalancePositionDescriptions: CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'very small by historical standards',
  betweenOuterAndInnerLow: 'small by historical standards',
  insideInnerBand: 'typical by historical standards',
  betweenInnerAndOuterHigh: 'large by historical standards',
  aboveOuterBand: 'very large by historical standards',
}

const federalDebtPositionDescriptions: CompactHistoricalMetricDefinition['positionDescriptions'] = {
  belowOuterBand: 'very low by postwar standards',
  betweenOuterAndInnerLow: 'low by postwar standards',
  insideInnerBand: 'typical by postwar standards',
  betweenInnerAndOuterHigh: 'high by postwar standards',
  aboveOuterBand: 'very high by postwar standards',
}

export const realGdpCompactDefinition: CompactHistoricalMetricDefinition = {
  seriesLabel: 'Real GDP growth',
  frequency: 'quarterly',
  historicalBands: {
    recentObservationCount: 20,
    comparisonWindow: { kind: 'trailing-years', years: 25 },
    innerPercentiles: [25, 75], outerPercentiles: [10, 90],
    minimumFiniteObservations: 20,
    latestObservationPolicy: 'last-observation',
  },
  showZeroLine: true,
  showLatestMarker: true,
  helpText: sharedBandHelp,
  zeroLineMeaning: 'Zero separates increasing from decreasing real GDP.',
  positionDescriptions: gdpPositionDescriptions,
}

export const realGdpPerCapitaCompactDefinition: CompactHistoricalMetricDefinition = {
  seriesLabel: 'Real GDP per capita growth',
  frequency: 'quarterly',
  historicalBands: {
    recentObservationCount: 20,
    comparisonWindow: { kind: 'trailing-years', years: 25 },
    innerPercentiles: [25, 75], outerPercentiles: [10, 90],
    minimumFiniteObservations: 20,
    latestObservationPolicy: 'last-observation',
  },
  showZeroLine: true,
  showLatestMarker: true,
  helpText: sharedBandHelp,
  zeroLineMeaning:
    'Zero separates increasing from decreasing real output per person.',
  positionDescriptions: perCapitaPositionDescriptions,
}

export const laborProductivityGrowthCompactDefinition: CompactHistoricalMetricDefinition = {
  seriesLabel: 'Productivity growth',
  frequency: 'quarterly',
  historicalBands: {
    recentObservationCount: 20,
    comparisonWindow: { kind: 'trailing-years', years: 25 },
    innerPercentiles: [25, 75], outerPercentiles: [10, 90],
    minimumFiniteObservations: 20,
    latestObservationPolicy: 'last-observation',
  },
  showZeroLine: true,
  showLatestMarker: true,
  helpText: {
    ...sharedBandHelp,
    description: `${sharedBandHelp.description} The line shows year-over-year growth in output per hour.`,
  },
  zeroLineMeaning:
    'Zero separates higher from lower productivity than one year earlier.',
  positionDescriptions: productivityPositionDescriptions,
}

export const headlineCpiCompactDefinition: CompactHistoricalMetricDefinition = {
  seriesLabel: 'CPI inflation',
  frequency: 'monthly',
  historicalBands: {
    recentObservationCount: 61,
    comparisonWindow: { kind: 'trailing-years', years: 25 },
    innerPercentiles: [25, 75], outerPercentiles: [10, 90],
    minimumFiniteObservations: 60,
    latestObservationPolicy: 'last-observation',
  },
  showZeroLine: true,
  showLatestMarker: true,
  referenceLines: [{ value: 2, label: '2% policy reference' }],
  helpText: {
    heading: 'Recent historical comparison: past 25 years',
    description:
      'The dark band shows the middle 50% of CPI readings during this period. The lighter bands extend the range to the middle 80%. Readings outside the shaded area fall within the highest or lowest 10% of the comparison period. The thin 2% line is a policy reference. The Federal Reserve’s formal 2% inflation target applies to PCE inflation, not CPI.',
  },
  zeroLineMeaning: 'Zero separates rising from falling consumer prices.',
  positionDescriptions: cpiPositionDescriptions,
  accessibleSummarySuffix: (model) =>
    `${formatCpiAssessment(classifyCpiAssessment(model.latestObservation.value))} The 2% line is a policy reference; the Federal Reserve formally targets PCE inflation.`,
}

export const unemploymentCompactDefinition: CompactHistoricalMetricDefinition = {
  seriesLabel: 'Unemployment rate',
  frequency: 'monthly',
  historicalBands: {
    recentObservationCount: 61,
    comparisonWindow: { kind: 'trailing-years', years: 25 },
    innerPercentiles: [25, 75],
    outerPercentiles: [10, 90],
    minimumFiniteObservations: 60,
    latestObservationPolicy: 'last-observation',
  },
  showZeroLine: false,
  showLatestMarker: true,
  helpText: {
    heading: 'Unemployment level and historical context',
    description:
      'The unemployment rate is the share of the labor force without a job and actively looking for work. The labor force includes employed people plus unemployed people who are available and have recently looked for work. Some people who want work are not counted if they are not actively looking. The line shows the latest five years. The dark band is the middle 50% and the lighter band is the middle 80% of monthly readings over the trailing 25 years. Lower readings occupy the lower historical bands; the bands describe frequency, not a target. A 12-month move of at least 0.3 percentage point is classified as rising or falling; smaller moves are little changed.',
  },
  zeroLineMeaning:
    'No zero line is shown because zero unemployment is not a realistic or meaningful reference.',
  positionDescriptions: unemploymentPositionDescriptions,
}

export const primeAgeEmploymentCompactDefinition:
CompactHistoricalMetricDefinition = {
  seriesLabel: 'Prime-age employment',
  frequency: 'monthly',
  historicalBands: {
    recentObservationCount: 61,
    comparisonWindow: { kind: 'trailing-years', years: 25 },
    innerPercentiles: [25, 75],
    outerPercentiles: [10, 90],
    minimumFiniteObservations: 60,
    latestObservationPolicy: 'last-observation',
  },
  showZeroLine: false,
  showLatestMarker: true,
  interactiveDetails: true,
  helpText: {
    heading: 'Prime-age employment and historical context',
    description:
      'Prime age means ages 25–54, a range less affected by retirement and schooling than an all-age measure. The line shows the latest five years. The dark band is the middle 50% and the lighter band is the middle 80% of monthly readings over the trailing 25 years. Higher readings occupy the higher historical bands. The measure does not describe hours, pay, job quality, or why someone is not employed.',
  },
  zeroLineMeaning:
    'No zero line is shown because zero is not a meaningful reference for this metric.',
  positionDescriptions: primeAgeEmploymentPositionDescriptions,
}

export const payrollGrowthCompactDefinition:
CompactHistoricalMetricDefinition = {
  seriesLabel: 'Three-month average payroll change',
  frequency: 'monthly',
  historicalBands: {
    recentObservationCount: 61,
    comparisonWindow: { kind: 'trailing-years', years: 25 },
    innerPercentiles: [25, 75],
    outerPercentiles: [10, 90],
    minimumFiniteObservations: 60,
    latestObservationPolicy: 'last-observation',
  },
  showZeroLine: true,
  showLatestMarker: true,
  interactiveDetails: true,
  valueFormatter: formatSignedThousands,
  helpText: {
    heading: 'Payroll growth and historical context',
    description:
      'Payroll growth measures the monthly change in nonfarm payroll employment. The displayed value averages the latest three valid consecutive monthly changes to reduce month-to-month noise. Positive values mean net job gains and negative values mean net job losses. The bands show where three-month-average payroll changes have commonly fallen during the trailing 25 years; they describe historical frequency, not a target or forecast. Payroll estimates are revised as additional information becomes available.',
  },
  zeroLineMeaning:
    'Zero separates net payroll growth from net payroll decline.',
  positionDescriptions: payrollGrowthPositionDescriptions,
  accessibleSummarySuffix: () =>
    'Every plotted value and both historical bands use the same complete three-month-average series. Payroll estimates are revised as additional information becomes available.',
}

export const savingRateCompactDefinition:
CompactHistoricalMetricDefinition = {
  seriesLabel: 'Personal saving rate',
  frequency: 'monthly',
  historicalBands: {
    recentObservationCount: 61,
    comparisonWindow: { kind: 'trailing-years', years: 25 },
    innerPercentiles: [25, 75],
    outerPercentiles: [10, 90],
    minimumFiniteObservations: 60,
    latestObservationPolicy: 'last-observation',
  },
  showZeroLine: false,
  showLatestMarker: true,
  interactiveDetails: true,
  pointComparison: {
    months: 12,
    label: 'Change from 12 months earlier',
  },
  helpText: {
    heading: 'Personal saving and historical context',
    description:
      'The personal saving rate is aggregate personal saving divided by aggregate disposable personal income. It is the share of after-tax income not used for current consumption and related outlays: a 3% rate means households collectively saved about $3 of every $100 of disposable income that month. A falling positive rate means households are still saving in aggregate but retaining a smaller share of current income; it does not prove that households are drawing down accumulated assets or increasing borrowing. The national rate is an aggregate and can differ sharply across households. A 12-month change within 0.2 percentage point of zero is classified as broadly stable. The line shows five years, while the bands show the middle 50% and middle 80% of valid monthly readings over the trailing 25 years. The bands describe frequency, not a target or a judgment that higher or lower is always better.',
  },
  zeroLineMeaning:
    'No zero line is shown because zero is not the primary interpretive reference for this metric.',
  positionDescriptions: savingRatePositionDescriptions,
}

export const homeOwnershipCostCompactDefinition:
CompactHistoricalMetricDefinition = {
  seriesLabel: 'Modeled ownership-cost share',
  frequency: 'monthly',
  historicalBands: {
    recentObservationCount: 61,
    comparisonWindow: {
      kind: 'trailing-years-with-all-available-fallback',
      years: 25,
    },
    innerPercentiles: [25, 75],
    outerPercentiles: [10, 90],
    minimumFiniteObservations: 60,
    latestObservationPolicy: 'last-observation',
  },
  showZeroLine: false,
  showLatestMarker: true,
  interactiveDetails: true,
  referenceLines: [{
    value: homeOwnershipAffordabilityThreshold,
    label: '30% = Atlanta Fed affordability threshold',
  }],
  showReferenceLineLabels: true,
  pointThreshold: {
    value: homeOwnershipAffordabilityThreshold,
    label: 'Affordability threshold',
    differenceLabel: 'Difference',
  },
  helpText: {
    heading: 'Home-ownership affordability and historical context',
    description:
      'This national measure models the annual cost of purchasing and owning the median-priced home as a share of median household income. Costs include principal and interest, property taxes, homeowners insurance, and private mortgage insurance, using the Atlanta Fed’s published 10% down-payment and 30-year fixed-rate financing assumptions. The 30% line is the Atlanta Fed affordability threshold. A 42% reading means modeled annual costs equal about $42 of every $100 of median household income. This is a prospective-buyer model, not the payment burden of a typical current homeowner; local conditions and costs for owners with older mortgages, larger down payments, or no mortgage can differ substantially. Bands use all available official history until 25 years exist, then automatically use the trailing 25 years. They describe frequency, not an affordability target.',
  },
  zeroLineMeaning: 'No zero line is shown because zero is not a useful affordability reference.',
  positionDescriptions: homeOwnershipPositionDescriptions,
  accessibleSummary: createHomeOwnershipAccessibleSummary,
  comparisonLabel: (model) => {
    const years = new Date(`${model.latestObservation.date}T00:00:00Z`).getUTCFullYear() -
      new Date(`${model.comparisonStart}T00:00:00Z`).getUTCFullYear()
    return years >= 25
      ? 'Trailing 25-year historical comparison'
      : `Available history since ${new Date(`${model.comparisonStart}T00:00:00Z`).getUTCFullYear()}`
  },
  accessibleSummarySuffix: formatHomeOwnershipHistoricalPosition,
}

export const housingStartsCompactDefinition:
CompactHistoricalMetricDefinition = {
  seriesLabel: 'Housing starts per 1,000 residents',
  frequency: 'monthly',
  historicalBands: {
    recentObservationCount: 61,
    comparisonWindow: { kind: 'trailing-years', years: 25 },
    innerPercentiles: [25, 75],
    outerPercentiles: [10, 90],
    minimumFiniteObservations: 60,
    latestObservationPolicy: 'latest-finite',
  },
  showZeroLine: false,
  showLatestMarker: true,
  interactiveDetails: true,
  valueFormatter: (value) => value === null ? 'Unavailable' : `${value.toFixed(2)} per 1,000 residents`,
  helpText: {
    heading: 'Housing construction and population context',
    description:
      'A housing start is recorded when excavation begins for a building’s footings or foundation. The headline is a three-month average of a seasonally adjusted annual rate, not a forecast. Multifamily totals can be volatile because every unit is counted when one building starts. Historical bands compare three-month-average starts per 1,000 residents over the trailing 25 years, allowing more coherent comparison across differently sized U.S. populations. Starts enter the construction pipeline; they are not completed or occupied homes and do not determine whether construction is sufficient for household formation, replacement, vacancies, affordability, or a past shortage. One monthly movement is not a general economic forecast.',
  },
  zeroLineMeaning: 'No zero line is shown because zero is not a useful reference for this metric.',
  positionDescriptions: housingStartsPositionDescriptions,
}

export const manufacturingOutputCompactDefinition:
CompactHistoricalMetricDefinition = {
  seriesLabel: 'Three-month-average manufacturing production growth',
  frequency: 'monthly',
  historicalBands: {
    recentObservationCount: 61,
    comparisonWindow: { kind: 'trailing-years', years: 25 },
    innerPercentiles: [25, 75],
    outerPercentiles: [10, 90],
    minimumFiniteObservations: 60,
    latestObservationPolicy: 'latest-finite',
  },
  showZeroLine: true,
  showLatestMarker: true,
  interactiveDetails: true,
  valueFormatter: formatSignedPercentage,
  helpText: {
    heading: 'Inflation-adjusted manufacturing production',
    description: 'The line estimates the inflation-adjusted volume of goods produced across U.S. manufacturing industries. Because vehicles, machinery, chemicals, food, semiconductors, and other products are unlike, the Federal Reserve combines production estimates in an index rather than counting identical items. The card compares a complete three-month average with the same period one year earlier. Positive values mean real output increased, negative values mean it decreased, and zero means it matched its year-earlier level. Output can rise while employment falls because productivity, automation, hours, outsourcing, and product mix can change. This is not employment, productivity, sales revenue, prices, profits, capacity use, or manufacturing’s GDP share; the bands describe historical frequency, not a target or forecast.',
  },
  zeroLineMeaning: 'Zero = inflation-adjusted manufacturing production matched its year-earlier level',
  positionDescriptions: manufacturingOutputPositionDescriptions,
}

export const businessInvestmentCompactDefinition: CompactHistoricalMetricDefinition = {
  seriesLabel: 'Real business investment growth',
  frequency: 'quarterly',
  historicalBands: {
    recentObservationCount: 21,
    comparisonWindow: { kind: 'all-available' },
    innerPercentiles: [25, 75], outerPercentiles: [10, 90],
    minimumFiniteObservations: 20,
    latestObservationPolicy: 'latest-finite',
  },
  showZeroLine: true,
  showLatestMarker: true,
  interactiveDetails: true,
  valueFormatter: formatSignedPercentage,
  comparisonLabel: () => 'Available history since 2008',
  helpText: {
    heading: 'Real private nonresidential fixed investment',
    description: 'This measure tracks inflation-adjusted private business spending on equipment, nonresidential structures, software, and research. Rising investment often suggests that firms expect future demand to justify expanding or upgrading productive assets, but it may also reflect replacement, automation, policy incentives, or previously planned projects. Lower investment may indicate delayed or reduced projects, but can also follow unusually strong prior investment. The measure tracks new spending, not the total capital stock, net investment after depreciation, business confidence, or guaranteed future production.',
  },
  zeroLineMeaning: 'Zero = real business investment matched its year-earlier level',
  positionDescriptions: businessInvestmentPositionDescriptions,
}

export const corporateProfitShareCompactDefinition: CompactHistoricalMetricDefinition = {
  seriesLabel: 'Adjusted after-tax corporate-profit share of GDP',
  frequency: 'quarterly',
  historicalBands: {
    recentObservationCount: 21,
    comparisonWindow: { kind: 'trailing-years', years: 25 },
    innerPercentiles: [25, 75], outerPercentiles: [10, 90],
    minimumFiniteObservations: 80,
    latestObservationPolicy: 'latest-finite',
  },
  showZeroLine: false,
  showLatestMarker: true,
  interactiveDetails: true,
  valueFormatter: formatPercentage,
  helpText: {
    heading: 'Adjusted after-tax corporate profits as a share of GDP',
    description: 'This measure compares adjusted after-tax corporate profits with total U.S. GDP. A rising share means profits are growing faster than the economy overall, or declining more slowly; a falling share means profits are lagging GDP. The ratio can change because of taxes, interest costs, wages, productivity, prices, industry mix, globalization, or market power. It does not show why the share changed, how profits are distributed across firms, or whether workers and households are better or worse off. The numerator includes inventory-valuation and capital-consumption adjustments intended to better reflect profits from current production.',
  },
  zeroLineMeaning: 'No zero line is shown because zero is not a useful reference for this ratio.',
  positionDescriptions: corporateProfitSharePositionDescriptions,
}

export function createFederalBudgetBalanceCompactDefinition(
  state: BudgetBalanceState,
): CompactHistoricalMetricDefinition {
  const stateLabel = formatBudgetBalanceStateLabel(state)
  const seriesLabel = state === 'deficit'
    ? 'Federal deficit as a share of GDP'
    : state === 'surplus'
      ? 'Federal surplus as a share of GDP'
      : 'Absolute federal budget balance as a share of GDP'
  const historicalSubject = state === 'deficit'
    ? 'federal deficit magnitudes'
    : state === 'surplus'
      ? 'federal surplus magnitudes'
      : 'absolute budget-balance magnitudes'
  return {
  seriesLabel,
  frequency: 'annual',
  historicalBands: {
    recentObservationCount: 5,
    comparisonWindow: { kind: 'all-available' },
    innerPercentiles: [25, 75], outerPercentiles: [10, 90],
    minimumFiniteObservations: 5,
    latestObservationPolicy: 'latest-finite',
  },
  showZeroLine: true,
  showLatestMarker: true,
  showAllObservationMarkers: true,
  interactiveDetails: true,
  interactiveCursor: 'pointer',
  unifiedFooterLabels: true,
  displayedPeriodPrefix: 'Displayed: ',
  interactionStateLabel: () => state === 'balanced' ? 'Balance gap' : stateLabel,
  valueFormatter: (value) => value === null ? 'Unavailable' : `${value.toFixed(1)}% of GDP`,
  comparisonLabel: (model) => `Historical bands use annual ${historicalSubject} from 1946–${model.comparisonEnd.slice(0, 4)}`,
  helpText: {
    heading: seriesLabel,
    description: 'The compact card shows deficit or surplus magnitude as a positive number. The expanded chart uses the signed budget balance, where deficits are negative and surpluses are positive. This is the annual deficit or surplus, not the total federal debt.',
  },
  zeroLineMeaning: state === 'balanced'
    ? 'Zero means perfect balance; higher values are farther from balance.'
    : `Zero means no ${state}; higher values mean a larger ${state}.`,
  positionDescriptions: budgetBalancePositionDescriptions,
  }
}

export const federalBudgetBalanceCompactDefinition =
  createFederalBudgetBalanceCompactDefinition('deficit')

export const federalDebtCompactDefinition: CompactHistoricalMetricDefinition = {
  seriesLabel: 'Federal debt held by the public',
  frequency: 'quarterly',
  historicalBands: {
    recentObservationCount: 21,
    comparisonWindow: { kind: 'all-available' },
    innerPercentiles: [25, 75], outerPercentiles: [10, 90],
    minimumFiniteObservations: 80,
    latestObservationPolicy: 'latest-finite',
  },
  showZeroLine: false,
  showLatestMarker: true,
  interactiveDetails: true,
  valueFormatter: formatPercentage,
  comparisonLabel: (model) => `Postwar quarterly history since ${model.comparisonStart.slice(0, 4)}`,
  helpText: {
    heading: 'Federal debt held by the public',
    description: 'Debt held by the public includes Treasury securities held outside federal government accounts, including holdings of investors, financial institutions, foreign governments, state and local governments, and the Federal Reserve. It excludes most debt held by federal trust funds. The ratio compares accumulated debt with annual GDP so different periods can be compared more meaningfully. This accumulated debt is distinct from the annual deficit, which measures new borrowing during one year. The historical bands describe frequency, not a safe or recommended range.',
  },
  zeroLineMeaning: 'No zero line is shown because zero is not a useful reference for this ratio.',
  positionDescriptions: federalDebtPositionDescriptions,
}

const compactDefinitions: Readonly<
  Partial<Record<string, CompactHistoricalMetricDefinition>>
> = {
  'real-gdp-growth': realGdpCompactDefinition,
  'real-gdp-per-capita-growth': realGdpPerCapitaCompactDefinition,
  'labor-productivity-growth': laborProductivityGrowthCompactDefinition,
  'headline-cpi-inflation': headlineCpiCompactDefinition,
  'unemployment-rate': unemploymentCompactDefinition,
  'prime-age-employment-ratio': primeAgeEmploymentCompactDefinition,
  'payroll-growth': payrollGrowthCompactDefinition,
  'personal-saving-rate': savingRateCompactDefinition,
  'home-ownership-cost-share': homeOwnershipCostCompactDefinition,
  'housing-starts': housingStartsCompactDefinition,
  'manufacturing-output': manufacturingOutputCompactDefinition,
  'real-business-investment-growth': businessInvestmentCompactDefinition,
  'corporate-profit-share': corporateProfitShareCompactDefinition,
  'federal-budget-balance': federalBudgetBalanceCompactDefinition,
  'federal-debt-held-by-public': federalDebtCompactDefinition,
}

export function getCompactHistoricalMetricDefinition(
  slug: string,
): CompactHistoricalMetricDefinition | null {
  return compactDefinitions[slug] ?? null
}

export function describeCompactHistoricalPosition(
  model: HistoricalBandModel,
  definition: CompactHistoricalMetricDefinition,
): string {
  const position = classifyHistoricalBandPosition(
    model.latestObservation.value,
    model,
  )
  return position === 'unavailable'
    ? 'unavailable relative to the historical bands'
    : definition.positionDescriptions[position]
}

export function createCompactHistoricalAccessibleSummary(
  model: HistoricalBandModel,
  definition: CompactHistoricalMetricDefinition,
): string {
  if (definition.accessibleSummary) return definition.accessibleSummary(model)
  const valueFormatter = definition.valueFormatter ?? formatPercentage
  const first = model.recentObservations.find(({ value }) => value !== null)
  const recentPath = first?.value === null || first?.value === undefined
    ? 'No finite recent path is available.'
    : `The five-year line begins at ${valueFormatter(first.value)} in ${formatObservationPeriod(first.date, definition.frequency)} and ends at ${valueFormatter(model.latestObservation.value)}.`
  const observationUnit = definition.frequency === 'monthly' ? 'months' : 'quarters'
  const suffix = definition.accessibleSummarySuffix?.(model)
  const bandRanges = definition.valueFormatter
    ? ` (${valueFormatter(model.innerLower)} to ${valueFormatter(model.innerUpper)}), and the lighter bands extend the range to the middle 80% (${valueFormatter(model.outerLower)} to ${valueFormatter(model.outerUpper)})`
    : ', and the lighter bands extend the range to the middle 80%'
  return `${definition.seriesLabel} was ${valueFormatter(model.latestObservation.value)} in ${formatObservationPeriod(model.latestObservation.date, definition.frequency)}. The line shows the latest ${model.recentObservationCount} ${observationUnit}. ${recentPath} The trailing comparison runs from ${formatObservationPeriod(model.comparisonStart, definition.frequency)} through ${formatObservationPeriod(model.comparisonEnd, definition.frequency)}. The dark band marks the middle 50% of historical readings${bandRanges}. ${definition.zeroLineMeaning} The latest reading is ${describeCompactHistoricalPosition(model, definition)}.${suffix ? ` ${suffix}` : ''}`
}
