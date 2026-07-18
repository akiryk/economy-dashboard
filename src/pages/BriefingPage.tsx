import { Link } from 'react-router-dom'
import { LaborBriefingTile } from '../features/briefing/LaborBriefingTile'
import { useLaborBriefing } from '../features/briefing/useLaborBriefing'

export function BriefingPage() {
  const state = useLaborBriefing()
  return (
    <div className="page briefing-page">
      <section className="page-intro" aria-labelledby="briefing-heading">
        <h1 id="briefing-heading">U.S. Economic Briefing</h1>
        <p>This initial preview contains one Labor Market dimension while the briefing framework is reviewed against real data.</p>
        <p><Link to="/">Return to the full research dashboard</Link></p>
      </section>
      {state.status === 'loading' && <p className="status-message" role="status">Loading Labor briefing…</p>}
      {state.status === 'error' && <p className="status-message status-message--error" role="alert">{state.message}</p>}
      {state.status === 'loaded' && state.result.status === 'unclear' && <section className="labor-briefing"><h2>Can people find and keep work?</h2><p role="status"><strong>Condition: unclear. Direction: unclear.</strong> {state.result.message}</p></section>}
      {state.status === 'loaded' && state.result.status === 'ready' && <LaborBriefingTile model={state.result} />}
    </div>
  )
}
