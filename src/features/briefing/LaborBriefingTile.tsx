import { useState, type CSSProperties } from 'react'
import { formatObservationPeriod } from '../economic-series/utils/economicSeries'
import type { LaborBriefingReady } from './laborBriefing'

interface LaborBriefingTileProps {
  model: LaborBriefingReady
}

function percent(value: number): string {
  const rounded = Math.round(value)
  const mod100 = rounded % 100
  const suffix = mod100 >= 11 && mod100 <= 13
    ? 'th'
    : rounded % 10 === 1 ? 'st' : rounded % 10 === 2 ? 'nd' : rounded % 10 === 3 ? 'rd' : 'th'
  return `${rounded}${suffix} percentile`
}

function ActivityGraphic({ reading }: { reading: LaborBriefingReady['activity'] }) {
  if (!reading) {
    return <div className="labor-visual labor-visual--neutral" role="img" aria-label="Labor Market Activity is unavailable.">
      <strong>Unavailable</strong>
    </div>
  }
  const style = { '--labor-activity-fill': `${reading.percentile}%` } as CSSProperties
  return <div
    className={`labor-visual labor-visual--${reading.band}`}
    role="img"
    aria-label={`${reading.tier}, at the ${percent(reading.percentile)} of full LMCI history. The midpoint marks the historical median, not a target.`}
  >
    <div className="labor-activity-bar" style={style} aria-hidden="true">
      <span className="labor-activity-bar__fill" />
      <span className="labor-activity-bar__midpoint"><i /><i /></span>
    </div>
    <strong>{reading.tier}</strong>
  </div>
}

function MomentumGraphic({ model }: { model: LaborBriefingReady }) {
  if (!model.momentum || model.momentumAngle === null) {
    return <div className="labor-visual labor-visual--neutral" role="img" aria-label="Labor Market Momentum is unavailable.">
      <strong>Unavailable</strong>
    </div>
  }
  const label = model.momentum.noFreshEvidence ? 'No fresh evidence' : model.momentum.tier
  const orientation = model.momentumAngle > 0 ? 'upward' : model.momentumAngle < 0 ? 'downward' : 'horizontal'
  return <div
    className={`labor-visual labor-visual--${model.momentum.band}`}
    role="img"
    aria-label={`${label}, at the ${percent(model.momentum.percentile)} of full LMCI history; the arrow points ${orientation}.`}
  >
    <svg className="labor-momentum-arrow" viewBox="0 0 88 88" aria-hidden="true">
      <line className="labor-momentum-arrow__axis" x1="8" y1="44" x2="80" y2="44" />
      <line className="labor-momentum-arrow__axis" x1="44" y1="8" x2="44" y2="80" />
      <g className="labor-momentum-arrow__indicator" transform={`translate(44 44) rotate(${-model.momentumAngle})`}>
        <path d="M -26 0 L 26 0 M 11 -13 L 26 0 L 11 13" />
      </g>
    </svg>
    <strong>{label}</strong>
  </div>
}

function comparisonHistory(model: LaborBriefingReady): string {
  const range = (start: string, end: string) => `${formatObservationPeriod(start, 'monthly')} through ${formatObservationPeriod(end, 'monthly')}`
  if (model.activity && model.momentum && model.activity.comparisonStart === model.momentum.comparisonStart && model.activity.comparisonEnd === model.momentum.comparisonEnd) {
    return range(model.activity.comparisonStart, model.activity.comparisonEnd)
  }
  const ranges = [model.activity, model.momentum].flatMap((reading) => reading ? [range(reading.comparisonStart, reading.comparisonEnd)] : [])
  return ranges.length > 0 ? ranges.join('; ') : 'unavailable'
}

export function LaborBriefingTile({ model }: LaborBriefingTileProps) {
  const [expanded, setExpanded] = useState(false)
  const expandedId = 'labor-briefing-expanded'
  return (
    <article className="labor-briefing" aria-labelledby="labor-briefing-question">
      <header className="labor-briefing__header">
        <p className="labor-briefing__eyebrow">Labor market</p>
        <h2 id="labor-briefing-question">{model.question}</h2>
      </header>
      <p className="labor-briefing__answer">{model.answer}</p>
      <div className="labor-metrics">
        <section className="labor-metric" aria-labelledby="labor-activity-label">
          <h3 id="labor-activity-label">Labor Market Activity</h3>
          <ActivityGraphic reading={model.activity} />
        </section>
        <section className="labor-metric" aria-labelledby="labor-momentum-label">
          <h3 id="labor-momentum-label">Labor Market Momentum</h3>
          <MomentumGraphic model={model} />
        </section>
      </div>

      <button
        className="labor-briefing__toggle"
        type="button"
        aria-expanded={expanded}
        aria-controls={expandedId}
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? 'Less' : 'More'} <span aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
      </button>

      {expanded && <div className="labor-briefing__expanded" id={expandedId}>
        <section className="labor-supporting" aria-labelledby="labor-supporting-heading">
          <h3 id="labor-supporting-heading">Supporting evidence</h3>
          <p>These measures provide context for the LMCI assessment but do not determine or override its headline Activity or Momentum tiers.</p>
          <div className="labor-supporting-grid">
            {model.supporting.map((evidence) => <section key={`${evidence.label}-${evidence.period}`}>
              <h4>{evidence.label}</h4>
              <p><strong>{evidence.value}</strong> · {evidence.period}</p>
              <p>{evidence.note}</p>
              <p>{evidence.sourceName}. <a href={evidence.link}>View {evidence.label.toLowerCase()} research card</a></p>
            </section>)}
          </div>
          {model.supportingErrors.map((message) => <p className="status-message status-message--compact" key={message}>{message}</p>)}
          {model.tension && <p className="labor-briefing__tension"><strong>Supporting tension:</strong> {model.tension}</p>}
          {(model.activity?.stale || model.momentum?.stale) && <p className="status-message status-message--compact"><strong>Stale LMCI evidence.</strong> Review the observation dates in the calculation details.</p>}
        </section>
        <details className="briefing-disclosure">
          <summary>How this assessment is calculated</summary>
          <div className="briefing-disclosure__content">
            <p><strong>LMCI Activity</strong> summarizes the overall level of U.S. labor-market conditions across a broad set of indicators.</p>
            <p><strong>LMCI Momentum</strong> summarizes whether those broad conditions are strengthening, holding steady, or weakening.</p>
            <p>Each current LMCI reading is compared with its committed historical series. The Activity bar shows its historical percentile, and the Momentum arrow shows the historical position of momentum.</p>
            {model.activity && <p><strong>Activity:</strong> {model.activity.tier} · {percent(model.activity.percentile)} · {model.activity.formattedPeriod}</p>}
            {model.momentum && <p><strong>Momentum:</strong> {model.momentum.tier} · {percent(model.momentum.percentile)} · {model.momentum.formattedPeriod}</p>}
            <p><strong>Comparison history:</strong> {comparisonHistory(model)}.</p>
            <p>Source: Federal Reserve Bank of Kansas City, Labor Market Conditions Indicators. <a href="https://www.kansascityfed.org/data-and-trends/labor-market-conditions-indicators/">LMCI methodology and current release</a>.</p>
            <p>Hakkio, Craig S., and Jonathan L. Willis. 2014. “Kansas City Fed’s Labor Market Conditions Indicators (LMCI).” Federal Reserve Bank of Kansas City, <cite>The Macro Bulletin</cite>, August 28.</p>
          </div>
        </details>
      </div>}
    </article>
  )
}
