import { useState, type ReactNode } from 'react'
import { FreshnessNotice } from '../../data-freshness/FreshnessNotice'

interface CompactMetricCardLayoutProps {
  cardId: string
  eyebrow: ReactNode
  question: ReactNode
  measureLabel: ReactNode
  latestValue: ReactNode
  compactVisual?: ReactNode
  expandedContent: ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
}

export function CompactMetricCardLayout({
  cardId,
  eyebrow,
  question,
  measureLabel,
  latestValue,
  compactVisual,
  expandedContent,
  collapsible = true,
  defaultExpanded = false,
}: CompactMetricCardLayoutProps) {
  const [expanded, setExpanded] = useState(collapsible ? defaultExpanded : true)
  const questionId = `${cardId}-question`
  const expandedId = `${cardId}-expanded`

  return (
    <article id={`${cardId}-card`} className="series-card" aria-labelledby={questionId}>
      <header className="series-card__header">
        <p className="series-card__eyebrow">{eyebrow}</p>
        <h3 id={questionId}>{question}</h3>
        <div className="series-card__title">{measureLabel}</div>
      </header>

      <FreshnessNotice />

      <div
        className={`series-card__headline${compactVisual ? ' series-card__headline--with-compact-visual' : ''}`}
      >
        {latestValue}
        {compactVisual}
      </div>

      {collapsible && (
        <button
          className="series-card__toggle"
          type="button"
          aria-expanded={expanded}
          aria-controls={expandedId}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Less' : 'More'}{' '}
          <span aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
        </button>
      )}

      {expanded && (
        <div className="series-card__expanded" id={expandedId}>
          {expandedContent}
        </div>
      )}
    </article>
  )
}
