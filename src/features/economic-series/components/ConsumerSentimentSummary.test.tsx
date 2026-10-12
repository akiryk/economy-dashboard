import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import type { EconomicSeries } from '../models/economicSeries'
import { ConsumerSentimentSummary } from './ConsumerSentimentSummary'

afterEach(cleanup)
function fixture(): EconomicSeries {
  return {
    id: 'consumer-sentiment', slug: 'consumer-sentiment', provider: 'Controlled source', providerSeriesId: 'ICS_ALL',
    title: 'Consumer sentiment', shortTitle: 'Sentiment', question: 'How do consumers feel about the economy?',
    description: 'A survey of finances and buying conditions. Higher readings mean more optimism.',
    sourceName: 'University of Michigan, Survey Research Center, Surveys of Consumers ©', sourceUrl: 'https://www.sca.isr.umich.edu/tables.html',
    units: 'Index 1966:Q1=100', frequency: 'monthly', seasonalAdjustment: 'Not seasonally adjusted', transformation: 'Level', retrievedAt: '2030-04-03', publicationStatus: 'preliminary',
    observations: [{ date: '2030-01-01', value: 100 }, { date: '2030-02-01', value: null }, { date: '2030-03-01', value: 60 }],
  }
}
describe('ConsumerSentimentSummary', () => {
  it('keeps the full curve, dated readings, short explanation, and attributed source visible without a toggle', async () => {
    const user = userEvent.setup()
    render(<ConsumerSentimentSummary series={fixture()} />)
    const card = screen.getByRole('article', { name: 'How do consumers feel about the economy?' })
    expect(within(card).queryByRole('button', { name: /More|Less/ })).not.toBeInTheDocument()
    expect(within(card).getByLabelText('Latest available sentiment')).toHaveTextContent('Latest preliminary reading60.0March 2030')
    expect(within(card).getByLabelText('Historical high')).toHaveTextContent('100.0January 2030')
    expect(within(card).getByLabelText('Historical low')).toHaveTextContent('60.0March 2030')
    expect(card).toHaveTextContent('index, not a percentage')
    expect(within(card).getByRole('link')).toHaveAttribute('href', fixture().sourceUrl)
    const chart = within(card).getByLabelText('Consumer sentiment historical chart')
    expect(chart.querySelectorAll('path')).toHaveLength(2)
    await user.click(chart)
    expect(within(card).getByRole('status')).toHaveTextContent('March 2030: 60.0')
    await user.keyboard('{ArrowLeft}')
    expect(within(card).getByRole('status')).toHaveTextContent('January 2030: 100.0')
    await user.keyboard('{End}')
    expect(within(card).getByRole('status')).toHaveTextContent('March 2030: 60.0')
  })
  it('updates a revised final reading, a new record month, and duplicate formatted values', () => {
    const series = fixture()
    const { rerender } = render(<ConsumerSentimentSummary series={series} />)
    rerender(<ConsumerSentimentSummary series={{ ...series, publicationStatus: 'final',
      observations: [...series.observations.slice(0, -1), { date: '2030-03-01', value: 50 }],
    }} />)
    expect(screen.getByLabelText('Latest available sentiment')).toHaveTextContent('Latest final reading50.0March 2030')
    expect(screen.getByLabelText('Historical low')).toHaveTextContent('50.0')
    rerender(<ConsumerSentimentSummary series={{ ...series, observations: [...series.observations,
      { date: '2030-04-01', value: 120 }],
    }} />)
    expect(screen.getByLabelText('Latest available sentiment')).toHaveTextContent('120.0April 2030')
    expect(screen.getByLabelText('Historical high')).toHaveTextContent('120.0April 2030')
  })
  it('shows a useful empty state with source attribution', () => {
    render(<ConsumerSentimentSummary series={{ ...fixture(), observations: [{ date: '2030-01-01', value: null }] }} />)
    expect(screen.getByLabelText('Latest available sentiment')).toHaveTextContent('Unavailable')
    expect(screen.queryByLabelText('Consumer sentiment historical chart')).not.toBeInTheDocument()
    expect(screen.getByRole('link')).toBeVisible()
  })
})
