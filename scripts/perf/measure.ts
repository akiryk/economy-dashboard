import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { chromium, type BrowserContext, type Page } from 'playwright'
import { compareSummaries, summarize, type MetricSummary } from './performanceResults.ts'

const FAST_3G = {
  name: 'fast-3g',
  latencyMs: 562.5,
  downloadBytesPerSecond: (1.6 * 1024 * 1024) / 8,
  uploadBytesPerSecond: (750 * 1024) / 8,
} as const
const CPU_4X = { name: 'cpu-4x', rate: 4 } as const
const VIEWPORT = { width: 1440, height: 900 } as const
const DEFAULT_RUNS = 5
const DEFAULT_VISIBLE_IMAGES = 3
const DEFAULT_RESULTS_DIR = 'performance-results'
const METRIC_NAMES = [
  'lcpMs',
  'cls',
  'fcpMs',
  'ttfbMs',
  'maxConcurrentImageRequests',
  'firstImageRequestStartMs',
  'firstVisibleImagesPaintedMs',
  'bytesTransferredBy3s',
] as const

type MetricName = (typeof METRIC_NAMES)[number]

interface ImageTiming {
  url: string
  startTime: number
  responseEnd: number
  transferSize: number
}

interface RunResult {
  run: number
  lcpMs: number | null
  lcpElement: string | null
  cls: number
  fcpMs: number | null
  ttfbMs: number | null
  imageResources: ImageTiming[]
  maxConcurrentImageRequests: number
  firstImageRequestStartMs: number | null
  firstVisibleImagesPaintedMs: number | null
  bytesTransferredBy3s: number
}

interface ResultSet {
  schemaVersion: 1
  label: string
  timestamp: string
  gitSha: string
  url: string
  viewport: typeof VIEWPORT
  profiles: { network: typeof FAST_3G; cpu: typeof CPU_4X }
  runsRequested: number
  visibleImageCount: number
  runs: RunResult[]
  summaries: Record<MetricName, MetricSummary>
  lcpElements: string[]
}

interface Options {
  url?: string
  label?: string
  runs: number
  visibleImages: number
  resultsDir: string
  compare?: [string, string]
}

interface WindowPerformanceState {
  lcpMs: number | null
  lcpElement: string | null
  cls: number
  firstVisibleImagesPaintedMs: number | null
}

declare global {
  interface Window {
    __performanceHarness: WindowPerformanceState
  }
}

function parseArguments(args: string[]): Options {
  const values = new Map<string, string>()
  for (const argument of args) {
    if (!argument.startsWith('--') || !argument.includes('=')) {
      throw new Error(`Expected --name=value, received: ${argument}`)
    }
    const [name, ...rest] = argument.slice(2).split('=')
    values.set(name, rest.join('='))
  }

  const runs = Number(values.get('runs') ?? DEFAULT_RUNS)
  const visibleImages = Number(values.get('visible-images') ?? DEFAULT_VISIBLE_IMAGES)
  if (!Number.isInteger(runs) || runs < 1) throw new Error('--runs must be a positive integer')
  if (!Number.isInteger(visibleImages) || visibleImages < 1) {
    throw new Error('--visible-images must be a positive integer')
  }

  const compareValue = values.get('compare')
  const compare = compareValue?.split(',')
  if (compare && (compare.length !== 2 || compare.some((label) => !label))) {
    throw new Error('--compare requires exactly two comma-separated labels')
  }

  const url = values.get('url')
  const label = values.get('label')
  if (!compare && (!url || !label)) throw new Error('Measurement requires --url and --label')
  const labels = compare ?? (label ? [label] : [])
  if (labels.some((value) => !/^[a-zA-Z0-9._-]+$/.test(value))) {
    throw new Error('Labels may contain only letters, numbers, dots, underscores, and hyphens')
  }

  return {
    url,
    label,
    runs,
    visibleImages,
    resultsDir: values.get('results-dir') ?? DEFAULT_RESULTS_DIR,
    compare: compare as [string, string] | undefined,
  }
}

async function installObservers(page: Page, visibleImages: number): Promise<void> {
  await page.addInitScript({ content: `(() => {
    window.__performanceHarness = {
      lcpMs: null,
      lcpElement: null,
      cls: 0,
      firstVisibleImagesPaintedMs: null
    };
    window.__performanceHarnessObservers = [];

    const describeElement = (element) => {
      if (!element) return null;
      if (element instanceof HTMLImageElement && element.currentSrc) return element.currentSrc;
      if (element.id) return '#' + CSS.escape(element.id);
      const classes = Array.from(element.classList).slice(0, 2).map((name) => '.' + CSS.escape(name)).join('');
      return element.tagName.toLowerCase() + classes;
    };

    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const entry = entries[entries.length - 1];
      if (!entry) return;
      window.__performanceHarness.lcpMs = entry.startTime;
      window.__performanceHarness.lcpElement = entry.url || describeElement(entry.element);
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    window.__performanceHarnessObservers.push(lcpObserver);

    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__performanceHarness.cls += entry.value || 0;
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
    window.__performanceHarnessObservers.push(clsObserver);

    const checkVisibleImages = () => {
      if (window.__performanceHarness.firstVisibleImagesPaintedMs !== null) return;
      const visible = Array.from(document.images).filter((image) => {
        const rect = image.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top < innerHeight && rect.bottom > 0;
      }).slice(0, ${visibleImages});
      if (visible.length >= ${visibleImages} && visible.every((image) => image.complete && image.naturalWidth > 0)) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          window.__performanceHarness.firstVisibleImagesPaintedMs = performance.now();
        }));
        return;
      }
      requestAnimationFrame(checkVisibleImages);
    };
    requestAnimationFrame(checkVisibleImages);
  })();` })
}

async function throttle(context: BrowserContext, page: Page): Promise<void> {
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: FAST_3G.latencyMs,
    downloadThroughput: FAST_3G.downloadBytesPerSecond,
    uploadThroughput: FAST_3G.uploadBytesPerSecond,
  })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_4X.rate })
}

function maxConcurrency(images: ImageTiming[]): number {
  const events = images.flatMap((image) => [
    { time: image.startTime, delta: 1 },
    { time: image.responseEnd, delta: -1 },
  ]).sort((a, b) => a.time - b.time || a.delta - b.delta)
  let active = 0
  let maximum = 0
  for (const event of events) {
    active += event.delta
    maximum = Math.max(maximum, active)
  }
  return maximum
}

async function measureRun(url: string, run: number, visibleImages: number): Promise<RunResult> {
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({ viewport: VIEWPORT, serviceWorkers: 'block' })
    const page = await context.newPage()
    await installObservers(page, visibleImages)
    await throttle(context, page)
    await page.goto(url, { waitUntil: 'load', timeout: 120_000 })
    await page.waitForTimeout(3_500)

    const result = await page.evaluate(({ currentRun }) => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const imageUrls = new Set([...document.images].flatMap((image) => [image.currentSrc, image.src]).filter(Boolean))
      const imageResources = resources
        .filter((entry) => entry.initiatorType === 'img' || imageUrls.has(entry.name))
        .map((entry) => ({
          url: entry.name,
          startTime: entry.startTime,
          responseEnd: entry.responseEnd,
          transferSize: entry.transferSize,
        }))
      const paint = performance.getEntriesByName('first-contentful-paint')[0]
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      return {
        run: currentRun,
        lcpMs: window.__performanceHarness.lcpMs,
        lcpElement: window.__performanceHarness.lcpElement,
        cls: window.__performanceHarness.cls,
        fcpMs: paint?.startTime ?? null,
        ttfbMs: navigation?.responseStart ?? null,
        imageResources,
        maxConcurrentImageRequests: 0,
        firstImageRequestStartMs: imageResources.length ? Math.min(...imageResources.map((entry) => entry.startTime)) : null,
        firstVisibleImagesPaintedMs: window.__performanceHarness.firstVisibleImagesPaintedMs,
        bytesTransferredBy3s: resources
          .filter((entry) => entry.responseEnd <= 3_000)
          .reduce((total, entry) => total + entry.transferSize, 0),
      }
    }, { currentRun: run })
    if (result.lcpMs === null) {
      throw new Error('LCP was not observed; the page did not produce a largest-contentful-paint entry')
    }
    return {
      ...result,
      maxConcurrentImageRequests: maxConcurrency(result.imageResources),
    }
  } finally {
    await browser.close()
  }
}

function formatNumber(value: number | null): string {
  return value === null ? 'n/a' : value.toFixed(2)
}

async function compare(labels: [string, string], resultsDir: string): Promise<void> {
  const [baselineLabel, comparisonLabel] = labels
  const load = async (label: string): Promise<ResultSet> => JSON.parse(
    await readFile(path.join(resultsDir, `${label}.json`), 'utf8'),
  ) as ResultSet
  const baseline = await load(baselineLabel)
  const comparison = await load(comparisonLabel)
  if (baseline.url !== comparison.url) throw new Error('Comparison labels must use the same URL')
  if (JSON.stringify(baseline.profiles) !== JSON.stringify(comparison.profiles)) {
    throw new Error('Comparison labels must use the same throttling profiles')
  }

  const baselineElements = baseline.lcpElements.join(', ') || 'unavailable'
  const comparisonElements = comparison.lcpElements.join(', ') || 'unavailable'
  console.log(`LCP element — ${baselineLabel}: ${baselineElements}; ${comparisonLabel}: ${comparisonElements}`)
  if (baselineElements !== comparisonElements) {
    console.warn('WARNING: LCP elements differ, so the LCP delta is not a like-for-like comparison.')
  }

  const rows = compareSummaries(baseline.summaries, comparison.summaries)
  console.table(rows.map((row) => ({
    metric: row.metric,
    baseline: formatNumber(row.baseline),
    comparison: formatNumber(row.comparison),
    delta: formatNumber(row.delta),
    'delta %': formatNumber(row.percentDelta),
    'noise floor': formatNumber(row.noiseFloor),
    significant: row.significant === null ? 'n/a' : row.significant ? 'yes' : 'no',
  })))
}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2))
  if (options.compare) {
    await compare(options.compare, options.resultsDir)
    return
  }

  const runs: RunResult[] = []
  for (let run = 1; run <= options.runs; run += 1) {
    console.log(`Measuring ${options.url}, run ${run}/${options.runs}`)
    runs.push(await measureRun(options.url!, run, options.visibleImages))
  }
  const summaries = Object.fromEntries(METRIC_NAMES.map((name) => [
    name,
    summarize(runs.map((run) => run[name])),
  ])) as Record<MetricName, MetricSummary>
  const result: ResultSet = {
    schemaVersion: 1,
    label: options.label!,
    timestamp: new Date().toISOString(),
    gitSha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    url: options.url!,
    viewport: VIEWPORT,
    profiles: { network: FAST_3G, cpu: CPU_4X },
    runsRequested: options.runs,
    visibleImageCount: options.visibleImages,
    runs,
    summaries,
    lcpElements: [...new Set(runs.map((run) => run.lcpElement).filter((value): value is string => value !== null))],
  }
  await mkdir(options.resultsDir, { recursive: true })
  const outputPath = path.join(options.resultsDir, `${options.label}.json`)
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`)
  console.log(`Wrote ${outputPath}`)
  console.table(Object.entries(summaries).map(([metric, summary]) => ({
    metric,
    median: formatNumber(summary.median),
    min: formatNumber(summary.min),
    max: formatNumber(summary.max),
    'noise floor': formatNumber(summary.noiseFloor),
    'noise floor %': formatNumber(summary.noiseFloorPercent),
  })))
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
