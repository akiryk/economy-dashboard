import type { EconomicSeries } from '../models/economicSeries'
import { formatObservationPeriod } from '../utils/economicSeries'

interface TradeRow {
  date: string
  goodsBalance: number
  servicesBalance: number
  totalBalance: number
  exports: number
  imports: number
}

function alignTradeSeries(series: readonly EconomicSeries[]): TradeRow[] {
  const [goodsExports, goodsImports, servicesExports, servicesImports] = series
  if (!goodsExports || !goodsImports || !servicesExports || !servicesImports) return []
  const maps = [goodsImports, servicesExports, servicesImports].map((item) => new Map(item.observations.map(({ date, value }) => [date, value])))
  return goodsExports.observations.flatMap(({ date, value }) => {
    const [goodsImport, servicesExport, servicesImport] = maps.map((map) => map.get(date))
    if ([value, goodsImport, servicesExport, servicesImport].some((item) => item === null || item === undefined)) return []
    const goodsBalance = value! - goodsImport!
    const servicesBalance = servicesExport! - servicesImport!
    return [{ date, goodsBalance, servicesBalance, totalBalance: goodsBalance + servicesBalance, exports: value! + servicesExport!, imports: goodsImport! + servicesImport! }]
  })
}

function dollars(value: number): string {
  return `${value < 0 ? '−' : value > 0 ? '+' : ''}$${Math.abs(value).toFixed(1)}B`
}

export function TradeCompositionDetails({ series }: { series: readonly EconomicSeries[] }) {
  const rows = alignTradeSeries(series)
  const recent = rows.slice(-8).reverse()
  return <>
    <section aria-labelledby="trade-composition-heading">
      <h4 id="trade-composition-heading">What makes up the trade balance?</h4>
      <p>The United States can run a large goods deficit while partly offsetting it with a services surplus. Values below are signed quarterly seasonally adjusted annual rates: exports minus imports, in billions of dollars. Null quarters remain omitted rather than interpolated.</p>
      <div className="table-scroll"><table className="observations-table"><caption>Recent goods, services, and total trade balances</caption><thead><tr><th scope="col">Quarter</th><th scope="col">Goods balance</th><th scope="col">Services balance</th><th scope="col">Total balance</th></tr></thead><tbody>{recent.map((row) => <tr key={row.date}><th scope="row">{formatObservationPeriod(row.date, 'quarterly')}</th><td>{dollars(row.goodsBalance)}</td><td>{dollars(row.servicesBalance)}</td><td>{dollars(row.totalBalance)}</td></tr>)}</tbody></table></div>
    </section>
    <section aria-labelledby="trade-flows-heading">
      <h4 id="trade-flows-heading">Is the balance changing because of exports or imports?</h4>
      <p>A narrowing deficit can result from stronger exports, weaker imports, or both. Those patterns have different economic meanings, so the balance alone cannot explain why the gap changed.</p>
      <div className="table-scroll"><table className="observations-table"><caption>Recent exports and imports of goods and services</caption><thead><tr><th scope="col">Quarter</th><th scope="col">Exports</th><th scope="col">Imports</th></tr></thead><tbody>{recent.map((row) => <tr key={row.date}><th scope="row">{formatObservationPeriod(row.date, 'quarterly')}</th><td>{dollars(row.exports)}</td><td>{dollars(row.imports)}</td></tr>)}</tbody></table></div>
    </section>
  </>
}
