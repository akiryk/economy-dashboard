import type { EconomicObservation } from '../models/economicSeries'

type SentimentReading = EconomicObservation & { value: number }

export interface ConsumerSentimentContext {
  observations: EconomicObservation[]
  first: SentimentReading
  latest: SentimentReading
  highest: SentimentReading
  lowest: SentimentReading
}

/** Returns finite extrema across available history; ties use their earliest month. */
export function deriveConsumerSentimentContext(
  observations: readonly EconomicObservation[],
): ConsumerSentimentContext | null {
  const ordered = [...observations].sort((a, b) => a.date.localeCompare(b.date))
  const finite = ordered.filter((item): item is SentimentReading =>
    item.value !== null && Number.isFinite(item.value))
  const first = finite[0]
  const latest = finite.at(-1)
  if (!first || !latest) return null

  let highest = first
  let lowest = first
  for (const item of finite) {
    if (item.value > highest.value) highest = item
    if (item.value < lowest.value) lowest = item
  }

  // Explicit monthly slots preserve gaps and give pointer and keyboard selection
  // the same calendar spacing as the line.
  const byDate = new Map(ordered.map((item) => [item.date, item.value]))
  const monthly: EconomicObservation[] = []
  const date = new Date(`${first.date}T00:00:00Z`)
  while (date.toISOString().slice(0, 10) <= latest.date) {
    const period = date.toISOString().slice(0, 10)
    monthly.push({ date: period, value: byDate.get(period) ?? null })
    date.setUTCMonth(date.getUTCMonth() + 1)
  }
  return { observations: monthly, first, latest, highest, lowest }
}

/** Plain unsmoothed line geometry, with a separate path at each missing month. */
export function createConsumerSentimentPlot(context: ConsumerSentimentContext) {
  let minimum = Math.floor(context.lowest.value / 20) * 20
  let maximum = Math.ceil(context.highest.value / 20) * 20
  if (minimum === maximum) { minimum -= 20; maximum += 20 }
  const x = (index: number) => 50 + index / Math.max(1, context.observations.length - 1) * 620
  const y = (value: number) => 15 + (maximum - value) / (maximum - minimum) * 185
  const paths: string[] = []
  let path = ''
  context.observations.forEach(({ value }, index) => {
    if (value === null) {
      if (path) paths.push(path)
      path = ''
    } else path += `${path ? ' L' : 'M'} ${x(index).toFixed(2)} ${y(value).toFixed(2)}`
  })
  if (path) paths.push(path)
  const ticks = Array.from({ length: 5 }, (_, index) => minimum + (maximum - minimum) * index / 4)
  return { paths, ticks, x, y }
}
