import { lazy, Suspense, useMemo } from 'react'
import rawData from '../data/housing-construction-details.json'
import {
  createRegionalHousingAccessibleSummary,
  deriveRegionalHousingStarts,
  housingPipelineStages,
  housingRegionLabels,
  housingRegions,
  latestSharedRegionalPeriod,
  validateHousingConstructionDetails,
  type HousingPipelineStage,
} from '../utils/housingConstructionDetails'
import { formatObservationPeriod } from '../utils/economicSeries'
import './HousingConstructionDetails.css'

const EconomicTimeSeriesChart = lazy(() => import('../charts/EconomicTimeSeriesChart'))
const data = validateHousingConstructionDetails(rawData)

const stageLabels: Readonly<Record<HousingPipelineStage, string>> = {
  permits: 'Permits',
  starts: 'Starts',
  underConstruction: 'Under construction',
  completions: 'Completions',
}

export function HousingConstructionDetails() {
  const regional = useMemo(() => deriveRegionalHousingStarts(data), [])
  const latestRegionalDate = latestSharedRegionalPeriod(regional)
  const latestPipelineDate = housingPipelineStages
    .map((stage) => data.pipeline[stage].at(-1)?.date)
    .filter((date): date is string => Boolean(date))
    .sort()[0] ?? null

  return <div className="housing-details">
    <section aria-labelledby="regional-housing-heading">
      <h4 id="regional-housing-heading">Where is housing being started?</h4>
      <p>
        The primary comparison divides each region’s seasonally adjusted annualized
        starts by that region’s Census population estimate for the same calendar
        year. Annual population estimates are held constant within their year;
        months without a published population year remain unavailable.
      </p>
      <p className="sr-only">{createRegionalHousingAccessibleSummary(regional)}</p>
      <div className="housing-details__grid">
        {housingRegions.map((region) => {
          const observations = regional[region].filter(({ date }) => date >= '2021-01-01')
          return <section key={region} aria-labelledby={`housing-region-${region}`}>
            <h5 id={`housing-region-${region}`}>{housingRegionLabels[region]}</h5>
            <Suspense fallback={<p role="status">Loading regional chart…</p>}>
              <EconomicTimeSeriesChart
                kind="single"
                observations={observations}
                seriesName={`${housingRegionLabels[region]} starts per 1,000 residents`}
                frequency="monthly"
                units="Annualized starts per 1,000 residents"
                transformation="Regional starts divided by same-calendar-year regional population"
                includeZero={false}
                valueFormat="index"
                zoomStartDate={observations[0]?.date ?? ''}
                zoomEndDate={observations.at(-1)?.date ?? ''}
                onZoomChange={() => undefined}
              />
            </Suspense>
          </section>
        })}
      </div>
      {latestRegionalDate && <table>
        <caption>Latest shared regional housing-start comparison, {formatObservationPeriod(latestRegionalDate, 'monthly')}</caption>
        <thead><tr><th scope="col">Region</th><th scope="col">Per 1,000 residents</th><th scope="col">Raw annualized pace</th></tr></thead>
        <tbody>{housingRegions.map((region) => {
          const point = regional[region].find(({ date }) => date === latestRegionalDate)!
          return <tr key={region}><th scope="row">{housingRegionLabels[region]}</th><td>{point.value?.toFixed(2)}</td><td>{point.rawAnnualizedThousands} thousand units</td></tr>
        })}</tbody>
      </table>}
    </section>

    <section aria-labelledby="housing-pipeline-heading">
      <h4 id="housing-pipeline-heading">What is moving through the construction pipeline?</h4>
      <p>
        Permits are authorizations; starts mark construction beginning; units under
        construction are active pipeline inventory; completions are newly finished
        units. A permit need not become a start, and starts do not finish on a fixed schedule.
      </p>
      <div className="housing-details__grid">
        {housingPipelineStages.map((stage) => {
          const rows = data.pipeline[stage]
          const observations = rows.map(({ date, total: value }) => ({ date, value }))
          return <section key={stage} aria-labelledby={`housing-stage-${stage}`}>
            <h5 id={`housing-stage-${stage}`}>{stageLabels[stage]}</h5>
            <Suspense fallback={<p role="status">Loading pipeline chart…</p>}>
              <EconomicTimeSeriesChart
                kind="single"
                observations={observations}
                seriesName={stageLabels[stage]}
                frequency="monthly"
                units={stage === 'underConstruction' ? 'Thousands of units, seasonally adjusted' : 'Thousands of units, seasonally adjusted annual rate'}
                transformation="Provider-published level"
                includeZero={false}
                valueFormat="thousands-units"
                zoomStartDate={observations[0]?.date ?? ''}
                zoomEndDate={observations.at(-1)?.date ?? ''}
                onZoomChange={() => undefined}
              />
            </Suspense>
          </section>
        })}
      </div>
      {latestPipelineDate && <table>
        <caption>Pipeline by housing-unit category, {formatObservationPeriod(latestPipelineDate, 'monthly')}</caption>
        <thead><tr><th scope="col">Stage</th><th scope="col">Total</th><th scope="col">Single-family</th><th scope="col">2–4 units</th><th scope="col">5+ units</th></tr></thead>
        <tbody>{housingPipelineStages.map((stage) => {
          const row = data.pipeline[stage].find(({ date }) => date === latestPipelineDate)
          return <tr key={stage}><th scope="row">{stageLabels[stage]}</th><td>{row?.total ?? '—'}</td><td>{row?.singleFamily ?? '—'}</td><td>{row?.twoToFour ?? '—'}</td><td>{row?.fiveOrMore ?? '—'}</td></tr>
        })}</tbody>
      </table>}
      <p>
        Values are housing units, not structures. Permit, start, and completion
        values are thousands at a seasonally adjusted annual rate; under-construction
        values are seasonally adjusted thousands in the active inventory. Large
        multifamily projects can make starts volatile because all units are recorded
        when one building starts. Current estimates are preliminary and prior months
        may be revised by Census and HUD.
      </p>
    </section>
  </div>
}
