import { useMemo } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import { ConsumerSentimentChart } from '../charts/ConsumerSentimentChart'
import { deriveConsumerSentimentContext } from '../utils/consumerSentiment'
import { formatObservationPeriod } from '../utils/economicSeries'
import { CompactMetricCardLayout } from './CompactMetricCardLayout'
import './consumerSentiment.css'

export function ConsumerSentimentSummary({ series }: { series: EconomicSeries }) {
  const context = useMemo(() => deriveConsumerSentimentContext(series.observations), [series.observations])
  const sinceYear = context?.first.date.slice(0, 4)
  return <CompactMetricCardLayout cardId="consumer-sentiment" eyebrow="Consumer sentiment"
    question={series.question} measureLabel="University of Michigan Index of Consumer Sentiment"
    collapsible={false}
    latestValue={<>
      <p className="consumer-sentiment__description">{series.description} This is an index, not a percentage (1966 Q1 = 100).</p>
      <div className="consumer-sentiment__readings">
        <div className="series-current" aria-label="Latest available sentiment">
          <p className="series-current__label">Latest {series.publicationStatus ?? 'available'} reading</p>
          <p className="series-current__value">{context?.latest.value.toFixed(1) ?? 'Unavailable'}</p>
          <p className="series-current__period">{context ? formatObservationPeriod(context.latest.date, 'monthly') : 'No valid observations'}</p>
        </div>
        {context && <>
          <div aria-label="Historical high" className="consumer-sentiment__record">
            <p>Highest since {sinceYear}</p><strong>{context.highest.value.toFixed(1)}</strong>
            <p>{formatObservationPeriod(context.highest.date, 'monthly')}</p>
          </div>
          <div aria-label="Historical low" className="consumer-sentiment__record">
            <p>Lowest since {sinceYear}</p><strong>{context.lowest.value.toFixed(1)}</strong>
            <p>{formatObservationPeriod(context.lowest.date, 'monthly')}</p>
          </div>
        </>}
      </div>
    </>}
    expandedContent={<>
      {context && <ConsumerSentimentChart context={context} />}
      <p className="consumer-sentiment__source">
        Source: <a href={series.sourceUrl}>{series.sourceName}</a>. Retrieved {series.retrievedAt}.
      </p>
      <p className="consumer-sentiment__note">Checked daily for Michigan’s preliminary and final monthly releases. Preliminary readings may be revised. High and low use the available monthly history; dates show the first occurrence if tied.</p>
    </>}
  />
}
