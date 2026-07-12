interface EconomicSeriesPresentation {
  topicLabel: string
  latestValueLabel: string
  whatThisTellsYou: string
  whatThisLeavesOut: string
  relatedIndicators: readonly string[]
  recentObservationCount: number
  recentObservationsCaption: string
  valueColumnLabel: string
}

const presentations: Readonly<Record<string, EconomicSeriesPresentation>> = {
  'real-gdp-growth': {
    topicLabel: 'Economic growth',
    latestValueLabel: 'Latest real GDP growth',
    whatThisTellsYou:
      'Real GDP measures the inflation-adjusted value of goods and services produced in the United States. Year-over-year growth compares output with the same period one year earlier.',
    whatThisLeavesOut:
      'Total GDP growth does not show how gains are distributed, whether GDP per person is rising, or whether typical households are financially better off.',
    relatedIndicators: ['Productivity', 'Employment', 'Real income'],
    recentObservationCount: 8,
    recentObservationsCaption:
      'Eight most recent real GDP growth observations',
    valueColumnLabel: 'Year-over-year growth',
  },
  'headline-cpi-inflation': {
    topicLabel: 'Inflation',
    latestValueLabel: 'Latest CPI inflation',
    whatThisTellsYou:
      'Headline CPI inflation measures how much the prices paid by urban consumers for a broad basket of goods and services have changed compared with the same month one year earlier.',
    whatThisLeavesOut:
      'The national average does not describe every household’s personal inflation rate. It also does not show whether prices are falling; a lower positive inflation rate means prices are generally rising more slowly, not returning to their previous level.',
    relatedIndicators: ['Wage growth', 'Core inflation', 'Consumer spending'],
    recentObservationCount: 12,
    recentObservationsCaption:
      'Twelve most recent headline CPI inflation observations',
    valueColumnLabel: 'Year-over-year inflation',
  },
}

export function getEconomicSeriesPresentation(
  slug: string,
): EconomicSeriesPresentation {
  const presentation = presentations[slug]
  if (!presentation) {
    throw new Error(`Missing presentation configuration for series: ${slug}`)
  }
  return presentation
}
