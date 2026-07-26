import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RealWageGrowthModel } from '../utils/realWageGrowth'
import { RealWageGrowthChart } from './RealWageGrowthChart'

const dispose = vi.fn()
vi.mock('echarts/core', () => ({
  use: vi.fn(),
  init: vi.fn(() => ({ setOption: vi.fn(), resize: vi.fn(), dispose })),
}))

const model: RealWageGrowthModel = {
  status: 'available',
  answerTier: 'positive',
  answer: 'Yes — wages are rising faster than prices.',
  latestObservation: { date: '2026-06-01', value: 0.5 },
  observations: [
    { date: '2026-05-01', value: null },
    { date: '2026-06-01', value: 0.5 },
  ],
  recentObservations: [
    { date: '2026-05-01', value: null },
    { date: '2026-06-01', value: 0.5 },
  ],
  domain: [-0.1, 0.6],
  visiblePeriod: ['2026-05-01', '2026-06-01'],
  historicalBands: {
    status: 'ready',
    recentObservations: [
      { date: '2026-05-01', value: null },
      { date: '2026-06-01', value: 0.5 },
    ],
    comparisonStart: '2001-06-01',
    comparisonEnd: '2026-06-01',
    innerLower: -0.5,
    innerUpper: 0.75,
    median: 0.1,
    outerLower: -1,
    outerUpper: 1.5,
    latestObservation: { date: '2026-06-01', value: 0.5 },
    validObservationCount: 300,
    recentObservationCount: 61,
  },
}

describe('RealWageGrowthChart', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('exposes a real-text summary and decorative canvas', async () => {
    const { container, unmount } = render(
      <RealWageGrowthChart model={model} accessibleSummary="Complete summary" />,
    )
    expect(screen.getByRole('figure', { name: 'Complete summary' })).toBeVisible()
    const periods = screen.getByLabelText('Visible real wage growth period')
    expect(periods).toHaveTextContent('May 2026')
    expect(periods).toHaveTextContent('June 2026')
    expect(screen.getByText('Zero = wage growth matched inflation')).toBeVisible()
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    unmount()
    await waitFor(() => expect(dispose).toHaveBeenCalledOnce())
  })

  it('applies the expanded presentation without changing chart behavior', () => {
    render(
      <RealWageGrowthChart
        model={model}
        accessibleSummary="Expanded summary"
        variant="expanded"
      />,
    )
    expect(screen.getByRole('figure', { name: 'Expanded summary' }))
      .toHaveClass('real-wage-growth-chart--expanded')
    expect(screen.queryByRole('button', {
      name: 'Explain real wage growth historical bands',
    })).not.toBeInTheDocument()
  })

  it('explains compact historical bands without hiding chart interaction', async () => {
    const user = userEvent.setup()
    render(
      <RealWageGrowthChart model={model} accessibleSummary="Complete summary" />,
    )
    await user.click(screen.getByRole('button', {
      name: 'Explain real wage growth historical bands',
    }))
    const dialog = screen.getByRole('dialog', {
      name: 'Real wage growth historical context',
    })
    expect(dialog).toHaveTextContent('middle 50%')
    expect(dialog).toHaveTextContent('middle 80%')
    expect(dialog).toHaveTextContent('historical frequency, not a target')
    expect(dialog).toHaveTextContent(
      'near zero can still be historically typical or atypical',
    )
    expect(screen.getByLabelText(/Use left and right arrow keys/)).toBeVisible()
  })

  it('reveals exact month and value by keyboard, pointer, and tap', async () => {
    const user = userEvent.setup()
    render(
      <RealWageGrowthChart model={model} accessibleSummary="Complete summary" />,
    )
    const chart = screen.getByLabelText(/Use left and right arrow keys/)
    vi.spyOn(chart, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, width: 100, height: 144,
      top: 0, right: 100, bottom: 144, left: 0,
      toJSON: () => ({}),
    })
    await user.tab()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Real wage growthJune 2026+0.5%',
    )
    await user.keyboard('{Escape}')
    expect(chart).toHaveFocus()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    fireEvent.pointerMove(chart, { clientX: 100, pointerType: 'mouse' })
    expect(screen.getByRole('status')).toHaveTextContent('+0.5%')
    fireEvent.pointerLeave(chart, { pointerType: 'mouse' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    fireEvent.pointerDown(chart, { clientX: 100, pointerType: 'touch' })
    expect(screen.getByRole('status')).toHaveTextContent('June 2026')
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders an unavailable state without a chart', () => {
    render(
      <RealWageGrowthChart
        model={{
          ...model,
          status: 'unavailable',
          answerTier: 'unavailable',
          answer: 'Current real wage growth is unavailable.',
          latestObservation: null,
          domain: null,
        }}
        accessibleSummary="Unavailable"
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'same-month wage and consumer-price observations are unavailable',
    )
  })
})
