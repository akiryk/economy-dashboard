/**
 * Keeps chart tooltips from becoming hover targets and interrupting the chart's
 * pointer tracking. Spread this into every ECharts tooltip that displays data.
 */
export const sharedChartTooltip = {
  trigger: 'axis' as const,
  renderMode: 'html' as const,
  confine: true,
  enterable: false,
  extraCssText: 'white-space: pre-line; pointer-events: none;',
}
