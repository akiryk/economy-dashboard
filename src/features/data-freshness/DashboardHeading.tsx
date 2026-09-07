import { formatDashboardHeading } from './dashboardRefreshMetadata'

export function DashboardHeading({ metadata }: { metadata: unknown }) {
  return (
    <h1 id="dashboard-heading">
      {formatDashboardHeading(metadata)}
    </h1>
  )
}
