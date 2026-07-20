import { useState, type CSSProperties } from 'react'
import type { LaborBriefingReady, LaborPrimaryReading } from './laborBriefing'

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

function ReadingDetails({ label, reading }: {
  label: string
  reading: LaborPrimaryReading<string>
}) {
  return <section className="labor-reading-detail">
    <h4>{label}</h4>
    <dl>
      <div><dt>Raw index</dt><dd>{reading.rawValue.toFixed(5)}</dd></div>
      <div><dt>Observation</dt><dd>{reading.formattedPeriod}</dd></div>
      <div><dt>Historical position</dt><dd>{percent(reading.percentile)}</dd></div>
      <div><dt>Tier</dt><dd>{reading.tier}</dd></div>
    </dl>
  </section>
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

      {expanded && <div className="labor-briefing__expanded" id={expandedId}>
        {(model.activity?.stale || model.momentum?.stale) && <p className="status-message status-message--compact"><strong>Stale LMCI evidence.</strong> Review the observation dates below.</p>}
        {model.tension && <p className="labor-briefing__tension"><strong>Supporting tension:</strong> {model.tension}</p>}
        <div className="labor-reading-details">
          {model.activity && <ReadingDetails label="LMCI Activity" reading={model.activity} />}
          {model.momentum && <ReadingDetails label="LMCI Momentum" reading={model.momentum} />}
        </div>
        <p className="labor-briefing__index-note">LMCI readings are standardized indexes centered on their historical averages. Positive and negative raw values are not percentages and are not bounded between −1 and +1.</p>
        <details className="briefing-disclosure">
          <summary>Why this label</summary>
          <div className="briefing-disclosure__content">
            <p>Available readings use all committed monthly LMCI history. Tied values share their average rank.</p>
            <p>The activity bar fill is the exact activity percentile; its marker is the 50th-percentile historical midpoint. Activity tiers begin at 0, 20, 40, 60, and 80.</p>
            <p>The momentum arrow maps 0–100 percentiles continuously to −45° through +45°, with the 50th percentile horizontal. Momentum tiers use the same boundaries.</p>
            {model.activity && <p>Activity: {model.activity.rawValue.toFixed(5)}, {percent(model.activity.percentile)}, {model.activity.tier}, observed {model.activity.formattedPeriod}{model.activity.stale ? '; stale' : '; current'}.</p>}
            {model.momentum && <p>Momentum: {model.momentum.rawValue.toFixed(5)}, {percent(model.momentum.percentile)}, {model.momentum.tier}, observed {model.momentum.formattedPeriod}{model.momentum.stale ? '; stale' : '; current'}.</p>}
          </div>
        </details>
        <details className="briefing-disclosure">
          <summary>Supporting evidence</summary>
          <div className="briefing-disclosure__content">
            <p>These measures provide context but do not determine or override either LMCI headline.</p>
            <div className="labor-supporting-grid">
              {model.supporting.map((evidence) => <section key={`${evidence.label}-${evidence.period}`}>
                <h4>{evidence.label}</h4>
                <p><strong>{evidence.value}</strong> · {evidence.period}</p>
                <p>{evidence.note}</p>
                <p>{evidence.sourceName}. <a href={evidence.link}>View research card</a></p>
              </section>)}
            </div>
            {model.supportingErrors.map((message) => <p className="status-message status-message--compact" key={message}>{message}</p>)}
            <p>Source: Federal Reserve Bank of Kansas City, Labor Market Conditions Indicators. <a href="https://www.kansascityfed.org/data-and-trends/labor-market-conditions-indicators/">LMCI methodology and current release</a>.</p>
            <p>Hakkio, Craig S., and Jonathan L. Willis. 2014. “Kansas City Fed’s Labor Market Conditions Indicators (LMCI).” Federal Reserve Bank of Kansas City, The Macro Bulletin, August 28.</p>
          </div>
        </details>
      </div>}

      <button
        className="labor-briefing__toggle"
        type="button"
        aria-expanded={expanded}
        aria-controls={expandedId}
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? 'Less' : 'More'} <span aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
      </button>
    </article>
  )
}
