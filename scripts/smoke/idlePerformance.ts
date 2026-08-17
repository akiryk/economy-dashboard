import { spawn, type ChildProcess } from 'node:child_process'
import process from 'node:process'
import { chromium, type Browser, type CDPSession } from 'playwright'

const HOST = '127.0.0.1'
const PORT = 4173
const BASE_URL = `http://${HOST}:${PORT}`
const IDLE_WINDOW_MS = 5_000
const SETTLE_WINDOW_MS = 2_000
const DEFAULT_RUNS = 1

const ROUTES = [
  { path: '/', heading: /^U\.S\. Economy,/ },
  { path: '/compare', heading: 'Compare economies' },
] as const

const BUDGETS = {
  scriptDurationMs: 150,
  taskDurationMs: 750,
  nodes: 100,
  eventListeners: 100,
} as const

interface PerformanceSnapshot {
  scriptDurationMs: number
  taskDurationMs: number
  nodes: number
  eventListeners: number
}

interface IdleDeltas extends PerformanceSnapshot {
  run: number
  route: string
}

function parseRuns(args: string[]): number {
  const runsArgument = args.find((argument) => argument.startsWith('--runs='))
  const runs = Number(runsArgument?.slice('--runs='.length) ?? DEFAULT_RUNS)
  if (!Number.isInteger(runs) || runs < 1) {
    throw new Error('--runs must be a positive integer')
  }
  return runs
}

async function waitForPreview(server: ChildProcess): Promise<void> {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Preview server exited with code ${server.exitCode}`)
    }
    try {
      const response = await fetch(`${BASE_URL}/`)
      if (response.ok) {
        await new Promise((resolve) => setTimeout(resolve, 250))
        if (server.exitCode !== null) {
          throw new Error(`Preview server exited with code ${server.exitCode}`)
        }
        return
      }
    } catch {
      // The server may not have bound its port yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Preview server did not become ready at ${BASE_URL}`)
}

function startPreview(): ChildProcess {
  return spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host', HOST,
    '--port', String(PORT),
    '--strictPort',
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

async function snapshot(session: CDPSession): Promise<PerformanceSnapshot> {
  const { metrics } = await session.send('Performance.getMetrics')
  const values = new Map(metrics.map(({ name, value }) => [name, value]))
  const required = (name: string): number => {
    const value = values.get(name)
    if (value === undefined) throw new Error(`CDP performance metric ${name} is unavailable`)
    return value
  }
  return {
    scriptDurationMs: required('ScriptDuration') * 1_000,
    taskDurationMs: required('TaskDuration') * 1_000,
    nodes: required('Nodes'),
    eventListeners: required('JSEventListeners'),
  }
}

async function measureIdle(
  browser: Browser,
  run: number,
  route: (typeof ROUTES)[number],
): Promise<IdleDeltas> {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    serviceWorkers: 'block',
  })
  try {
    const page = await context.newPage()
    const browserErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text())
    })
    page.on('pageerror', (error) => browserErrors.push(error.message))

    await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle', timeout: 30_000 })
    await page.getByRole('heading', { name: route.heading }).waitFor()
    await page.getByRole('article').first().waitFor()
    await page.waitForTimeout(SETTLE_WINDOW_MS)

    if (browserErrors.length > 0) {
      throw new Error(`${route.path} reported browser errors:\n${browserErrors.join('\n')}`)
    }

    const session = await context.newCDPSession(page)
    await session.send('Performance.enable')
    const before = await snapshot(session)
    await page.waitForTimeout(IDLE_WINDOW_MS)
    const after = await snapshot(session)
    await session.detach()

    return {
      run,
      route: route.path,
      scriptDurationMs: after.scriptDurationMs - before.scriptDurationMs,
      taskDurationMs: after.taskDurationMs - before.taskDurationMs,
      nodes: after.nodes - before.nodes,
      eventListeners: after.eventListeners - before.eventListeners,
    }
  } finally {
    await context.close()
  }
}

function assertBudget(metric: keyof typeof BUDGETS, observed: number): void {
  const allowed = BUDGETS[metric]
  if (observed > allowed) {
    const label = metric === 'scriptDurationMs'
      ? 'Idle scripting'
      : metric === 'taskDurationMs'
        ? 'Idle task activity'
        : metric === 'nodes'
          ? 'Idle DOM growth'
          : 'Idle event-listener growth'
    const unit = metric.endsWith('Ms') ? ' ms' : ''
    throw new Error(
      `${label} exceeded budget: observed ${observed.toFixed(1)}${unit} over ${IDLE_WINDOW_MS / 1_000} s; allowed ${allowed}${unit}`,
    )
  }
}

async function main(): Promise<void> {
  const runs = parseRuns(process.argv.slice(2))
  const server = startPreview()
  let serverErrors = ''
  server.stderr?.on('data', (chunk: Buffer) => { serverErrors += chunk.toString() })

  try {
    await waitForPreview(server)
    const browser = await chromium.launch({ headless: true })
    try {
      const results: IdleDeltas[] = []
      for (let run = 1; run <= runs; run += 1) {
        for (const route of ROUTES) {
          const result = await measureIdle(browser, run, route)
          results.push(result)
          console.log(JSON.stringify(result))
          for (const metric of Object.keys(BUDGETS) as (keyof typeof BUDGETS)[]) {
            assertBudget(metric, result[metric])
          }
        }
      }
      console.log(`Idle-performance smoke test passed ${runs} run(s) across ${ROUTES.length} routes with a ${IDLE_WINDOW_MS / 1_000} s observation window.`)
    } finally {
      await browser.close()
    }
  } catch (error) {
    if (serverErrors) console.error(serverErrors.trim())
    throw error
  } finally {
    server.kill('SIGTERM')
    await new Promise<void>((resolve) => {
      if (server.exitCode !== null) resolve()
      else server.once('exit', () => resolve())
    })
  }
}

await main()
