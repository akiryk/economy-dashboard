import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { CompactMetricCardLayout } from './CompactMetricCardLayout'

afterEach(cleanup)

function StatefulFixture() {
  const [range, setRange] = useState('20 years')
  return (
    <CompactMetricCardLayout
      cardId="example"
      eyebrow="Growth"
      question="Is it growing?"
      measureLabel="Example growth"
      latestValue={<div className="series-current">2.0%</div>}
      compactVisual={<figure>Compact visual</figure>}
      expandedContent={(
        <button type="button" onClick={() => setRange('5 years')}>{range}</button>
      )}
    />
  )
}

describe('CompactMetricCardLayout', () => {
  it('renders the required semantic order and starts collapsed', () => {
    const { container } = render(<StatefulFixture />)
    const article = screen.getByRole('article', { name: 'Is it growing?' })
    expect(Array.from(article.children).map(({ className }) => className)).toEqual([
      'series-card__header',
      'series-card__headline series-card__headline--with-compact-visual',
      'series-card__toggle',
    ])
    expect(within(article).getByText('Growth')).toBeVisible()
    expect(within(article).getByText('Example growth')).toBeVisible()
    expect(within(article).getByText('2.0%')).toBeVisible()
    expect(within(article).getByText('Compact visual')).toBeVisible()
    expect(container.querySelector('#example-expanded')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /More/ })).toHaveAttribute(
      'aria-controls',
      'example-expanded',
    )
  })

  it('supports keyboard disclosure and preserves parent-owned state', async () => {
    const user = userEvent.setup()
    render(<StatefulFixture />)
    const more = screen.getByRole('button', { name: /More/ })
    more.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: /Less/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    await user.click(screen.getByRole('button', { name: '20 years' }))
    await user.click(screen.getByRole('button', { name: /Less/ }))
    expect(screen.queryByRole('button', { name: '5 years' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /More/ }))
    expect(screen.getByRole('button', { name: '5 years' })).toBeVisible()
  })

  it('supports an always-expanded card and an omitted compact visual', () => {
    render(
      <CompactMetricCardLayout
        cardId="full"
        eyebrow="Topic"
        question="Full card?"
        measureLabel="Measure"
        latestValue={<p>Latest</p>}
        expandedContent={<a href="#source">Source</a>}
        collapsible={false}
      />,
    )
    expect(screen.queryByRole('button', { name: /More|Less/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Source' })).toBeVisible()
    expect(screen.getByRole('article').querySelector('.series-card__headline'))
      .not.toHaveClass('series-card__headline--with-compact-visual')
  })
})
