import { useScopedFreshness } from './FreshnessContext'

const labels = {
  'late-provider': 'Source update delayed',
  warning: 'Update requires review',
  'unexpectedly-stale': 'Data update overdue',
  failure: 'Data update failed',
  healthy: '',
} as const

export function FreshnessNotice() {
  const freshness = useScopedFreshness()
  if (!freshness || freshness.state === 'healthy') return null
  const urgent = freshness.state === 'unexpectedly-stale' || freshness.state === 'failure'
  return (
    <div
      className={`freshness-notice freshness-notice--${freshness.state}`}
      role={urgent ? 'alert' : 'status'}
    >
      <strong>{labels[freshness.state]}:</strong> {freshness.message}
    </div>
  )
}
