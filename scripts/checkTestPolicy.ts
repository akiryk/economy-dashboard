import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const datedDashboardHeading = /U\.S\. Economy, (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}/g
const uniqueMutableFormattedValue = /(?:within\([^)]*\)\.)?getByText\(\s*formatPercentage\([^)]*\)\s*,?\s*\)/gs
const fixedPluralAfterMutableValue = /toHaveTextContent\(\s*`[^`]*\$\{formatSignedPercentagePoints\([^}]+\)\} percentage points?[^`]*`\s*,?\s*\)/gs
const fixedProductionGap = /(?:date\s*===\s*['"]\d{4}-\d{2}-\d{2}['"][\s\S]{0,80}value\s*===\s*null|official (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{4} CPI index was unavailable)/g

export function dashboardPageTestPolicyViolations(source: string): string[] {
  return [
    ...[...source.matchAll(datedDashboardHeading)].map(({ 0: match }) =>
      `DashboardPage.test.tsx contains a mutable production-style heading assertion: "${match}"`),
    ...[...source.matchAll(uniqueMutableFormattedValue)].map(() =>
      'DashboardPage.test.tsx requires a mutable formatted percentage to be unique within a page or card.'),
    ...[...source.matchAll(fixedPluralAfterMutableValue)].map(() =>
      'DashboardPage.test.tsx hard-codes singular or plural prose after a mutable formatted value.'),
    ...[...source.matchAll(fixedProductionGap)].map(() =>
      'DashboardPage.test.tsx hard-codes a mutable production-data gap.'),
  ]
}

async function main() {
  const source = await readFile('src/pages/DashboardPage.test.tsx', 'utf8')
  const violations = dashboardPageTestPolicyViolations(source)
  if (violations.length === 0) {
    console.log('Test policy check passed.')
    return
  }

  throw new Error([
    ...violations,
    'Use controlled fixtures for exact mutable values and grammar; page-composition tests must assert only stable structure.',
  ].join('\n'))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
