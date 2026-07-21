import { lazy, Suspense } from 'react'

const GdpCompactChartPreviewPage = lazy(() => import('./GdpCompactChartPreviewPage').then((module) => ({ default: module.GdpCompactChartPreviewPage })))

export function GdpCompactChartPreviewRoute() {
  return <Suspense fallback={<p className="status-message" role="status">Loading compact-chart preview…</p>}>
    <GdpCompactChartPreviewPage />
  </Suspense>
}
