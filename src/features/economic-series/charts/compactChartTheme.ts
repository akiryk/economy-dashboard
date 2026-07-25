export const compactChartTheme = {
  line: '#245d72',
  innerBandFill: 'rgba(184, 148, 54, 0.28)',
  outerBandFill: 'rgba(184, 148, 54, 0.14)',
  zeroLine: '#56616d',
  policyReference: '#7b4f9d',
  latestMarker: '#245d72',
  markerBorder: '#ffffff',
} as const

export const compactReferenceLineTheme = {
  color: compactChartTheme.zeroLine,
  width: 1,
  type: 'dashed',
  opacity: 0.65,
  svgDashArray: '2 3',
} as const
