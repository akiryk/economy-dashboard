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
  id: InflationContributionCategoryId
  label: string
  contribution: number
  yearAgoContribution: number | null
  change: number | null
}

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
  if (headline <= 0) {
    const negative = [...categories]
      .filter(({ contribution }) => contribution < 0)
      .sort((left, right) => left.contribution - right.contribution)
    return negative.length > 0
      ? `${negative[0]!.label} is exerting the largest downward pull.`
      : 'Category effects are offsetting one another.'
  }

  const positive = categories.filter(({ contribution }) => contribution > 0)
  const totalPositive = contributionTotal(positive)
  if (totalPositive <= 0) return 'Category effects are offsetting one another.'

  const [first, second] = positive
  if (first && first.contribution / totalPositive >= 0.45) {
    return `${first.label} is the dominant driver.`
  }
  if (
    first &&
    second &&
    (first.contribution + second.contribution) / totalPositive >= 0.65
  ) {
    return `${first.label} and ${second.label.toLowerCase()} are the main drivers.`
  }
  const materialThreshold = 0.1
  if (positive.filter(({ contribution }) => contribution >= materialThreshold).length >= 4) {
    return 'Inflation is broad across several categories.'
  }
  return 'Several categories are contributing to inflation.'
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
