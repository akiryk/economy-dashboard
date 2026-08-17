import data from '../../economic-series/data/international-comparisons.json'
import { validateInternationalComparisonData, type InternationalComparisonData, type InternationalMetricId } from '../models/internationalComparison'

const validatedData = validateInternationalComparisonData(data)

export const internationalComparisonRepository = {
  getAll(): InternationalComparisonData {
    return validatedData
  },
  getMetric(id: InternationalMetricId) {
    const metric = validatedData.metrics.find((candidate) => candidate.id === id)
    if (!metric) throw new Error(`Unknown international comparison metric: ${id}`)
    return metric
  },
}
