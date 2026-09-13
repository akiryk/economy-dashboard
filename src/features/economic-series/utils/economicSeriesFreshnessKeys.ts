export function economicSeriesFreshnessKeys({
  slug,
  supportingSlugs,
  variant,
}: {
  slug: string
  supportingSlugs: readonly string[]
  variant?: string
}): string[] {
  const additionalKeys = variant === 'inflation-drivers'
    ? ['inflation-contributions']
    : slug === 'personal-saving-rate'
      ? ['saving-rate-by-income-decile']
      : slug === 'housing-starts'
        ? ['housing-construction-details', 'housing-supply-composition']
        : []
  return [slug, ...supportingSlugs, ...additionalKeys]
}
