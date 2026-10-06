import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

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

export function compactChartTestPolicyViolations(source: string): string[] {
  const literalPointDetails = /toHaveTextContent\(\s*['"](?:Personal saving rate|Change from 12 months earlier:|Modeled ownership-cost share|Difference:|\d{4}(?:Deficit|Surplus))[^'"\n]*\d[^'"\n]*['"]/g
  const literalLatestValue = /toHaveAttribute\(\s*['"]data-latest-value['"]\s*,\s*['"][^'"\n]*\d[^'"\n]*['"]/g
  const file = ts.createSourceFile('CompactHistoricalMetricChart.test.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const productionImports = new Set(file.statements.flatMap((statement) =>
    ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)
      && statement.moduleSpecifier.text.includes('/data/') && statement.importClause?.name
      ? [statement.importClause.name.text] : []))
  const violations: string[] = []
  function consumesProduction(node: ts.Node): boolean {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)
      && node.expression.text === 'validateEconomicSeries'
      && node.arguments[0] && ts.isIdentifier(node.arguments[0])
      && productionImports.has(node.arguments[0].text)) return true
    return node.getChildren(file).some(consumesProduction)
  }
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'it') {
      const callback = node.arguments[1]
      if (callback && consumesProduction(callback)) {
        const testSource = callback.getText(file)
        violations.push(
          ...[...testSource.matchAll(literalPointDetails)].map(() =>
            'CompactHistoricalMetricChart.test.tsx pins literal point details instead of deriving them from the selected observation.'),
          ...[...testSource.matchAll(literalLatestValue)].map(() =>
            'CompactHistoricalMetricChart.test.tsx pins a literal latest value instead of formatting the model observation.'),
        )
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return violations
}

async function main() {
  const [dashboard, compactChart] = await Promise.all([
    readFile('src/pages/DashboardPage.test.tsx', 'utf8'),
    readFile('src/features/economic-series/charts/CompactHistoricalMetricChart.test.tsx', 'utf8'),
  ])
  const violations = [
    ...dashboardPageTestPolicyViolations(dashboard),
    ...compactChartTestPolicyViolations(compactChart),
  ]
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
