import { Link } from 'react-router-dom'
import { LaborBriefingTile } from '../features/briefing/LaborBriefingTile'
import { useLaborBriefing } from '../features/briefing/useLaborBriefing'

export function BriefingPage() {
  const state = useLaborBriefing()
  return (
    <div className="page briefing-page">
      <section className="page-intro" aria-labelledby="briefing-heading">
        <h1 id="briefing-heading">U.S. Economic Briefing</h1>
        <p>Labor is the only implemented analytical tile. Five inert cells show the intended at-a-glance composition while layout and density are reviewed.</p>
        <p><Link to="/">Return to the full research dashboard</Link></p>
      </section>
      {state.status === 'loading' && <p className="status-message" role="status">Loading Labor briefing…</p>}
      {state.status === 'error' && <p className="status-message status-message--error" role="alert">{state.message}</p>}
      {state.status === 'loaded' && state.result.status === 'unclear' && <section className="labor-briefing"><h2>Can people find and keep work?</h2><p role="status"><strong>Condition: unclear. Direction: unclear.</strong> {state.result.message}</p></section>}
      {state.status === 'loaded' && state.result.status === 'ready' && <section className="briefing-grid" aria-label="At-a-glance layout preview">
        <LaborBriefingTile model={state.result} />
        <div className="briefing-placeholders" aria-hidden="true">
          {['Growth', 'Inflation', 'Households', 'Credit', 'Backdrop'].map((label) => <div className="briefing-placeholder" key={label}>
            <p>Layout placeholder</p><span>{label}</span><i /><i /><i />
          </div>)}
        </div>
      </section>}
    </div>
  )
}
