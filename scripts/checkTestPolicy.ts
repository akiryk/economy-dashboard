import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const datedDashboardHeading = /U\.S\. Economy, (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}/g

export function dashboardPageTestPolicyViolations(source: string): string[] {
  return [...source.matchAll(datedDashboardHeading)].map(({ 0: match }) =>
    `DashboardPage.test.tsx contains a mutable production-style heading assertion: "${match}"`)
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
    'Use invented metadata in a controlled headline test; page-composition tests must assert only stable structure.',
  ].join('\n'))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
