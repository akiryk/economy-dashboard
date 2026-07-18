import type { LaborBriefingReady } from './laborBriefing'
import { BriefingSparkline } from './BriefingSparkline'

interface LaborBriefingTileProps { model: LaborBriefingReady }

function EvidenceTrace({ evidence }: { evidence: LaborBriefingReady['primaries'][number] }) {
  const condition = evidence.condition
  const direction = evidence.direction
  return (
    <section className="briefing-trace__indicator">
      <h4>{evidence.label}</h4>
      <p><a href={evidence.link}>View research card</a></p>
      <dl>
        <div><dt>Latest</dt><dd>{evidence.value}, {evidence.period}</dd></div>
        {condition.evidence === 'adequate' && <>
          <div><dt>Raw percentile</dt><dd>{Math.round(condition.rawPercentile)}</dd></div>
          <div><dt>Oriented percentile</dt><dd>{condition.valence === 'unvalenced' ? 'Not valenced' : Math.round(condition.orientedPercentile)}</dd></div>
          <div><dt>Comparison</dt><dd>{condition.window.comparisonStart} to {condition.window.comparisonEnd}{condition.window.usedShortHistory ? ' (short history)' : ''}</dd></div>
          <div><dt>Condition</dt><dd>{condition.valence === 'unvalenced' ? condition.historicalPosition : `${condition.tier}; ${condition.group}`}</dd></div>
        </>}
        {direction.evidence === 'adequate' ? <>
          <div><dt>Recent change</dt><dd>{direction.currentChange.signedChange.toFixed(1)} over {direction.currentChange.windowPeriods} {direction.currentChange.frequency} periods; absolute {direction.currentChange.absoluteChange.toFixed(1)}</dd></div>
          <div><dt>Noise gate</dt><dd>{direction.noiseThreshold.toFixed(1)}; {direction.noiseGatePassed ? 'passed' : 'not passed'}</dd></div>
          <div><dt>Direction</dt><dd>{direction.direction}; underlying movement {direction.underlyingOrientation}{direction.direction === 'normalizing' ? '; Labor normalizing applied' : ''}</dd></div>
        </> : <div><dt>Direction</dt><dd>{direction.evidence.replaceAll('-', ' ')}</dd></div>}
        <div><dt>Freshness</dt><dd>{evidence.freshness.evidenceAgeDays.toFixed(0)} days old; {evidence.freshness.expectedCadenceDays}-day cadence; {evidence.freshness.state.replaceAll('-', ' ')}; direction {evidence.freshness.directionSuppressed ? 'suppressed' : 'available'}</dd></div>
      </dl>
    </section>
  )
}

export function LaborBriefingTile({ model }: LaborBriefingTileProps) {
  return (
    <article className="labor-briefing" aria-labelledby="labor-briefing-question">
      <header className="labor-briefing__header">
        <p className="labor-briefing__eyebrow">Labor market</p>
        <h2 id="labor-briefing-question">{model.question}</h2>
        <div className="labor-briefing__readings">
          <p><span>Condition</span><strong>{model.conditionLabel}</strong></p>
          <p><span>Direction</span><strong>{model.directionLabel}</strong></p>
        </div>
      </header>
      <p className="labor-briefing__synthesis">{model.synthesis}</p>
      <BriefingSparkline model={model.sparkline} />
      <p className="labor-briefing__freshness">{model.staleWarning && <strong>Stale evidence. </strong>}{model.freshnessLine}</p>
      <p><a href="/#employment-and-income">View Labor research cards</a></p>
      <details className="briefing-disclosure">
        <summary>Why this label</summary>
        <div className="briefing-disclosure__content">
          {model.primaries.map((evidence) => <EvidenceTrace key={evidence.id} evidence={evidence} />)}
          <section><h4>Dimension result</h4><dl>
            <div><dt>Primary condition groups</dt><dd>{model.primaries.map(({ condition }) => condition.evidence === 'adequate' && condition.valence !== 'unvalenced' ? condition.group : 'unclear').join(' and ')}</dd></div>
            <div><dt>Condition reason</dt><dd>{model.conditionReading.reason}; final {model.conditionLabel}</dd></div>
            <div><dt>Primary directions</dt><dd>{model.primaries.map(({ direction }) => direction.evidence === 'adequate' ? direction.direction : direction.evidence).join(' and ')}</dd></div>
            <div><dt>Direction reason</dt><dd>{model.directionReading.reason}; final {model.directionLabel}</dd></div>
            <div><dt>Payroll revisions</dt><dd>Payroll estimates are commonly revised. No vintage comparison is available.</dd></div>
          </dl></section>
        </div>
      </details>
      <details className="briefing-disclosure">
        <summary>Supporting evidence</summary>
        <div className="briefing-disclosure__content">
          <p>Supporting indicators provide context but do not determine either Labor reading.</p>
          {model.supporting.map((evidence) => <section key={evidence.id}>
            <h4>{evidence.label}</h4><p>{evidence.value}, {evidence.period}. {evidence.condition.evidence === 'adequate' ? evidence.condition.valence === 'unvalenced' ? evidence.condition.historicalPosition : evidence.condition.group : 'Historical comparison unavailable'}. Direction: {evidence.direction.evidence === 'adequate' ? evidence.direction.direction : evidence.direction.evidence.replaceAll('-', ' ')}.</p>
            <p>{evidence.role}. <a href={evidence.link}>View research card</a></p>
          </section>)}
          {model.supportingErrors.map((message) => <p className="status-message status-message--compact" key={message}>{message}</p>)}
        </div>
      </details>
    </article>
  )
}
