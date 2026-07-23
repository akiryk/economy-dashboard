export const inflationContributionCategoryIds = [
  'shelter',
  'other-services',
  'food',
  'energy',
  'goods-excluding-food-and-energy',
] as const

export type InflationContributionCategoryId =
  typeof inflationContributionCategoryIds[number]

export interface InflationContributionObservation {
  date: string
  headline: number
  categories: Record<InflationContributionCategoryId, number>
}

export interface InflationContributionCategory {
  id: string
  label: string
  contribution: number
  yearAgoContribution: number | null
  change: number | null
}

export interface CompactInflationContribution {
  id: string
  label: string
  contribution: number
  kind: 'category' | 'remainder'
}

export interface CompactInflationDriversModel {
  headlineInflation: number
  headlinePeriod: string
  displayedContributions: readonly CompactInflationContribution[]
  remainderContribution: number
  reconciliationDifference: number
  reconciliationStatus: 'reconciled' | 'unreconciled'
  summary: string
}

export const INFLATION_CONTRIBUTION_RECONCILIATION_TOLERANCE = 0.05
const OFFSET_SHARE_THRESHOLD = 0.25
const DOMINANT_SHARE_THRESHOLD = 0.45
const TOP_TWO_SHARE_THRESHOLD = 0.65
const BROAD_CONTRIBUTION_THRESHOLD = 0.1

const labels: Record<InflationContributionCategoryId, string> = {
  shelter: 'Shelter',
  'other-services': 'Other services',
  food: 'Food',
  energy: 'Energy',
  'goods-excluding-food-and-energy': 'Goods excluding food and energy',
}

export function buildInflationContributionCategories(
  current: InflationContributionObservation,
  prior: InflationContributionObservation | null,
): InflationContributionCategory[] {
  return inflationContributionCategoryIds
    .map((id) => {
      const contribution = current.categories[id]
      const yearAgoContribution = prior?.categories[id] ?? null
      return {
        id,
        label: labels[id],
        contribution,
        yearAgoContribution,
        change: yearAgoContribution === null
          ? null
          : contribution - yearAgoContribution,
      }
    })
    .sort((left, right) => right.contribution - left.contribution)
}

export function contributionTotal(
  categories: readonly Pick<InflationContributionCategory, 'contribution'>[],
): number {
  return categories.reduce((total, category) => total + category.contribution, 0)
}

export function contributionResidual(
  headline: number,
  categories: readonly Pick<InflationContributionCategory, 'contribution'>[],
): number {
  return headline - contributionTotal(categories)
}

export function summarizeInflationDrivers(
  headline: number,
  categories: readonly InflationContributionCategory[],
): string {
  if (!Number.isFinite(headline) || categories.length === 0) {
    return 'Inflation contribution data are unavailable.'
  }
  if (headline <= 0) {
    const negative = [...categories]
      .filter(({ contribution }) => contribution < 0)
      .sort((left, right) => left.contribution - right.contribution)
    return negative.length > 0
      ? `${negative[0]!.label} is exerting the largest downward pull.`
      : 'Category effects are offsetting one another.'
  }
  const positiveTotal = contributionTotal(
    categories.filter(({ contribution }) => contribution > 0),
  )
  const negativeMagnitude = Math.abs(contributionTotal(
    categories.filter(({ contribution }) => contribution < 0),
  ))
  if (
    positiveTotal > 0 &&
    negativeMagnitude / positiveTotal >= OFFSET_SHARE_THRESHOLD
  ) {
    return 'Positive and negative category contributions substantially offset one another.'
  }

  const positive = [...categories]
    .filter(({ contribution }) => contribution > 0)
    .sort((left, right) => right.contribution - left.contribution)
  const totalPositive = contributionTotal(positive)
  if (totalPositive <= 0) return 'Category effects are offsetting one another.'

  const [first, second] = positive
  if (first && first.contribution / totalPositive >= DOMINANT_SHARE_THRESHOLD) {
    return `${first.label} contributed most of the latest increase.`
  }
  if (
    first &&
    second &&
    (first.contribution + second.contribution) / totalPositive >= TOP_TWO_SHARE_THRESHOLD
  ) {
    return `${first.label} and ${second.label.toLowerCase()} contributed most of the latest increase.`
  }
  if (positive.filter(({ contribution }) =>
    contribution >= BROAD_CONTRIBUTION_THRESHOLD).length >= 4) {
    return 'Inflation is broad across several categories.'
  }
  return 'Several categories are contributing to inflation.'
}

export function deriveCompactInflationDriversModel({
  headlineInflation,
  headlinePeriod,
  categories,
}: {
  headlineInflation: number
  headlinePeriod: string
  categories: readonly InflationContributionCategory[]
}): CompactInflationDriversModel | null {
  const ids = new Set<string>()
  const hasInvalidCategory = categories.some(({ id, contribution }) => {
    if (
      !inflationContributionCategoryIds.includes(
        id as InflationContributionCategoryId,
      ) ||
      ids.has(id) ||
      !Number.isFinite(contribution)
    ) {
      return true
    }
    ids.add(id)
    return false
  })
  if (
    !Number.isFinite(headlineInflation) ||
    !headlinePeriod ||
    categories.length < 2 ||
    hasInvalidCategory
  ) {
    return null
  }

  const byMagnitude = [...categories].sort(
    (left, right) =>
      Math.abs(right.contribution) - Math.abs(left.contribution) ||
      left.label.localeCompare(right.label),
  )
  const selected = byMagnitude.slice(0, 4)
  const selectedIds = new Set(selected.map(({ id }) => id))
  const remainderContribution = contributionTotal(
    categories.filter(({ id }) => !selectedIds.has(id)),
  )
  const displayedContributions: CompactInflationContribution[] = [
    ...selected.map(({ id, label, contribution }) => ({
      id,
      label,
      contribution,
      kind: 'category' as const,
    })),
    {
      id: 'everything-else',
      label: 'Everything else',
      contribution: remainderContribution,
      kind: 'remainder' as const,
    },
  ].sort((left, right) =>
    right.contribution - left.contribution ||
    left.label.localeCompare(right.label))
  const reconciliationDifference =
    contributionResidual(headlineInflation, categories)
  const reconciliationStatus =
    Math.abs(reconciliationDifference) <=
      INFLATION_CONTRIBUTION_RECONCILIATION_TOLERANCE
      ? 'reconciled'
      : 'unreconciled'

  return {
    headlineInflation,
    headlinePeriod,
    displayedContributions,
    remainderContribution,
    reconciliationDifference,
    reconciliationStatus,
    summary: reconciliationStatus === 'reconciled'
      ? summarizeInflationDrivers(headlineInflation, categories)
      : 'The available category contributions do not fully reconcile to headline CPI.',
  }
}

export function formatContributionChange(change: number | null): string {
  if (change === null || !Number.isFinite(change)) {
    return 'change from a year ago unavailable'
  }
  const rounded = Math.round(Math.abs(change) * 10) / 10
  if (rounded === 0) return 'about the same as a year ago'
  const unit = rounded === 1 ? 'percentage point' : 'percentage points'
  return `${change > 0 ? 'up' : 'down'} ${rounded.toFixed(1)} ${unit} from a year ago`
}
