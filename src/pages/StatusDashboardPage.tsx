import { useEffect, useState } from 'react'
import type { EconomicSeries } from '../features/economic-series/models/economicSeries'
import { dashboardEconomicSeriesRepository } from '../features/economic-series/repositories/dashboardEconomicSeriesRepository'
import { CpiTile } from '../features/status-dashboard/CpiTile'
import { createCpiTileModel } from '../features/status-dashboard/cpiTileModel'
import { GrowthLaborTiles, SahmStatusTile } from '../features/status-dashboard/GrowthLaborTiles'
import { MarketsCreditTiles } from '../features/status-dashboard/MarketsCreditTiles'
import { useDashboardTheme } from '../features/status-dashboard/useDashboardTheme'
import type { DashboardThemePreference } from '../features/status-dashboard/useDashboardTheme'
import '../styles/statusDashboard.css'

interface CpiDataState {
  status: 'loading' | 'ready' | 'unavailable'
  headline?: EconomicSeries
}

export function StatusDashboardPage() {
  const [data, setData] = useState<CpiDataState>({ status: 'loading' })
  const { preference, resolvedTheme, setPreference } = useDashboardTheme()

  useEffect(() => {
    let active = true
    void dashboardEconomicSeriesRepository
      .getBySlug('dashboard-headline-cpi-inflation')
      .then((headline) => {
      if (!active) return
      setData(headline ? { status: 'ready', headline } : { status: 'unavailable' })
    }).catch(() => {
      if (active) setData({ status: 'unavailable' })
    })
    return () => { active = false }
  }, [])

  return (
    <div className="status-dashboard" data-theme={resolvedTheme}>
      <header className="status-dashboard__header">
        <h1>Economy status</h1>
        <label className="status-dashboard__theme-control">
          <span>Theme</span>
          <select
            value={preference}
            onChange={(event) => setPreference(event.target.value as DashboardThemePreference)}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </header>
      <section className="status-dashboard__grid" aria-label="Economic status indicators">
        <GrowthLaborTiles theme={resolvedTheme} />
        {data.status === 'loading' && (
          <article className="status-tile status-tile--message" aria-busy="true">
            <h2 className="status-tile__label">Inflation</h2>
            <p>Loading current data…</p>
          </article>
        )}
        {data.status === 'unavailable' && (
          <article className="status-tile status-tile--message" role="alert">
            <h2 className="status-tile__label">Inflation</h2>
            <p>Inflation data is temporarily unavailable.</p>
          </article>
        )}
        {data.status === 'ready' && data.headline && (() => {
          try {
            return <CpiTile model={createCpiTileModel(data.headline)} theme={resolvedTheme} />
          } catch {
            return (
              <article className="status-tile status-tile--message" role="alert">
                <h2 className="status-tile__label">Inflation</h2>
                <p>Inflation data is temporarily unavailable.</p>
              </article>
            )
          }
        })()}
        <SahmStatusTile theme={resolvedTheme} />
        <MarketsCreditTiles theme={resolvedTheme} />
      </section>
    </div>
  )
}
