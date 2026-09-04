interface DashboardRefreshMetadata {
  schemaVersion: 1
  lastSuccessfulDataRefreshDate: string
}

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/

function isIsoDate(value: string): boolean {
  if (!isoDatePattern.test(value)) return false
  return new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
}

export function parseDashboardRefreshMetadata(
  value: unknown,
): DashboardRefreshMetadata | null {
  if (typeof value !== 'object' || value === null ||
    !('schemaVersion' in value) || value.schemaVersion !== 1 ||
    !('lastSuccessfulDataRefreshDate' in value) ||
    typeof value.lastSuccessfulDataRefreshDate !== 'string' ||
    !isIsoDate(value.lastSuccessfulDataRefreshDate)) {
    return null
  }

  return {
    schemaVersion: 1,
    lastSuccessfulDataRefreshDate: value.lastSuccessfulDataRefreshDate,
  }
}

export function formatDashboardHeading(value: unknown): string {
  const metadata = parseDashboardRefreshMetadata(value)
  if (!metadata) return 'U.S. Economy'

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${metadata.lastSuccessfulDataRefreshDate}T00:00:00Z`))

  return `U.S. Economy, ${formattedDate}`
}
