import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { peerCountries, type InternationalMetric } from '../models/internationalComparison'
import { InternationalComparisonCard } from './InternationalComparisonCard'

afterEach(cleanup)

describe('InternationalComparisonCard', () => {
  function metricWithoutSpain(): InternationalMetric {
    return {
      id: 'prime-age-employment',
      title: 'Prime-age employment',
      question: 'What share of prime-age adults are employed?',
      unit: 'percent',
      frequency: 'quarterly',
      direction: 'higher-favorable',
      stalenessLimit: 2,
      source: {
        organization: 'OECD',
        dataflow: 'fixture',
        version: '1.0',
        url: 'https://sdmx.oecd.org/fixture',
        methodology: 'Fixture methodology.',
      },
      observations: peerCountries
        .filter(({ code }) => code !== 'ESP')
        .map(({ code }, index) => ({
          countryCode: code,
          period: code === 'USA' ? '2026-Q2' : '2026-Q1',
          value: code === 'USA' ? 80.5 : 70 + index,
        })),
    }
  }

  it('orders values, identifies the U.S. without color, and exposes periods and source', () => {
    const metric = metricWithoutSpain()
    metric.observations.push({ countryCode: 'ESP', period: '2026-Q1', value: 75 })
    render(<InternationalComparisonCard metric={metric} />)
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(10)
    expect(within(rows[0]!).getByText('United States')).toBeVisible()
    const usRow = rows.find((row) => within(row).queryAllByText('United States').length > 0)
    expect(usRow).toHaveClass('comparison-card__row--us')
    expect(within(usRow!).getByText('80.5%')).toBeVisible()
    expect(within(usRow!).getByText('Q2 2026')).toBeVisible()
    expect(screen.getByText(/United States ranks 1st of 10/i)).toBeVisible()
    expect(screen.getByRole('link', { name: 'OECD Data Explorer source' }))
      .toHaveAttribute('href', expect.stringContaining('sdmx.oecd.org'))
  })

  it('shows an unavailable peer as N/A and excludes it from rank', () => {
    render(<InternationalComparisonCard metric={metricWithoutSpain()} />)
    const spain = screen.getAllByRole('listitem').find((row) => within(row).queryByText('Spain'))
    expect(within(spain!).getByText('N/A')).toBeVisible()
    expect(within(spain!).getByText('No observation')).toBeVisible()
    expect(screen.getByText(/of 9 on this measure/i)).toBeVisible()
  })

  it('sorts a lower-is-favorable measure from low to high and labels the semantics', () => {
    const metric = metricWithoutSpain()
    metric.direction = 'lower-favorable'
    render(<InternationalComparisonCard metric={metric} />)
    expect(within(screen.getAllByRole('listitem')[0]!).getByText('Australia')).toBeVisible()
    expect(screen.getByText('Lower values are generally favorable for this measure.')).toBeVisible()
  })
})
