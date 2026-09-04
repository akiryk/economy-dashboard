import { useDashboardRefreshFreshness } from './FreshnessContext'

export function DashboardFreshnessAlert() {
  const freshness = useDashboardRefreshFreshness()
  if (!freshness || freshness.state !== 'failure') return null

  return (
    <p className="dashboard-refresh-alert" role="alert">
      <strong>{freshness.message}</strong>
    </p>
  )
}
