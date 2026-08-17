# Playwright verification

## Browser smoke tests

Run the lightweight production-preview smoke suite with:

```sh
npm run test:smoke
```

The suite builds the app, starts and stops a local Vite preview, opens the main
research dashboard and `/compare` in Chromium using only committed data, waits
for each route to settle, checks for browser errors, and observes five idle
seconds through Chrome DevTools Protocol metrics.
It guards against continuous scripting/task work and sustained growth in DOM
nodes or event listeners. The budgets are intentionally generous regression
tripwires, not performance targets or microbenchmarks.

Run this suite locally for changes to React rendering, shared dashboard UI,
charts, routing/lazy loading, lifecycle/observers, runtime browser data loading,
performance-sensitive code, or Vite/build configuration. It is optional for
docs-only, copy-only, and isolated pure-domain changes. GitHub Actions runs it
before every Pages deployment, and a failure blocks deployment. `npm run verify`
does not include it so routine deterministic verification remains fast.

On failure, use the reported metric delta and budget to distinguish continuous
main-thread work from DOM/listener accumulation. Reproduce with
`npm run test:smoke -- --runs=20`, inspect the affected component lifecycle in
Chrome Performance tools, and retain the existing deterministic root-cause test
in `DashboardPage.test.tsx` while fixing the browser-visible regression.

The smoke test allows at most 150 ms of scripting, 750 ms of total task time,
100 additional DOM nodes, and 100 additional listeners over its five-second
window. In 20 local production-preview runs on August 17, 2026, scripting,
nodes, and listeners all had zero growth; task time ranged from 0.435–3.718 ms.
The budgets sit far above that observed noise while remaining far below the
prior regression's hundreds of scripting milliseconds per second and sustained
near-full task utilization.

Epic 92 added `/compare` to the same gate. In five cross-route calibration runs
on August 17, 2026, both `/` and `/compare` had zero scripting, node, and
listener growth. Task deltas remained within budget; the largest was 22.395 ms.

Before Story 91, Playwright existed only as the manually invoked
`perf:measure` page-load harness. There was no Playwright configuration or
browser smoke suite; routine local `verify` and the deployment workflow covered
lint, types, unit/component tests, and the build without opening the app in a
browser. Story 91 adds the first browser regression gate without duplicating the
broader page-load comparison harness.

## Reproducible page-load performance

The performance harness measures any locally or remotely served page in a fresh headless Chromium context. Every run disables the browser cache, fixes the viewport at 1440×900, applies the named Fast 3G network profile through CDP, and applies 4× CPU throttling. It does not change application behavior.

Install dependencies and the matching Chromium binary once:

```sh
npm install
npx playwright install chromium
```

Start the production preview in one terminal:

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

Capture a five-run baseline in another terminal:

```sh
npm run perf:measure -- --url=http://127.0.0.1:4173/ --label=baseline --runs=5
```

The command creates `performance-results/baseline.json`. Results include the timestamp, current Git SHA, URL, viewport, throttling profiles, every individual cold run, median/min/max summaries, and the half-range noise floor. The output directory is ignored because measurements describe a particular machine and moment; conclusions that matter belong in the relevant story or review note.

Use `--url` for any route or origin. Use `--visible-images=N` to change the default requirement of three visible images. Pages with fewer images report the image-specific timing as `null` while retaining all standard page metrics.

### Metrics

- LCP records the latest largest-contentful-paint time and its element selector or image URL. Comparisons with different LCP elements are not like-for-like and require review.
- CLS sums layout shifts that did not follow recent input.
- FCP is the first-contentful-paint time.
- TTFB is navigation response start, separating delivery delay from later rendering.
- Image resource entries retain request start, response end, and transferred bytes.
- Maximum concurrent image requests exposes simultaneous request bursts.
- First image request start helps identify preload-scanner changes.
- Time until the first N visible images have loaded and passed two animation frames approximates their first painted state.
- Bytes transferred by three seconds distinguishes deferred loading from simple request reordering.

INP is deliberately excluded. With no real interaction, a synthetic INP number would not answer an interaction-latency question; that requires a purpose-built interaction script.

### Noise-floor rule and comparison

For each metric, the harness reports the median, minimum, maximum, and noise floor. The noise floor is half the observed range around identical code. A change smaller than that error bar is not an improvement.

After making a change, capture another labeled set with the same URL, run count, viewport, and profiles:

```sh
npm run perf:measure -- --url=http://127.0.0.1:4173/ --label=after-change --runs=5
```

Print a paste-ready comparison table:

```sh
npm run perf:measure -- --compare=baseline,after-change
```

The table reports each median, absolute and percentage deltas, the baseline noise floor, and whether the delta exceeds it. Negative timing, transfer, and concurrency deltas generally indicate less work or less delay; interpret CLS and element changes separately. Comparison refuses result sets with different URLs or profiles.

### Story 0 harness verification — July 19, 2026

Five runs are the settled default. The production preview was measured twice on the unchanged application commit `be8e2dbc89a10d3eb699fd8ecf950421dda8fd93`, using the documented Fast 3G and 4× CPU profiles.

| Page and metric | Median | Min–max | Noise floor |
|---|---:|---:|---:|
| `/` LCP | 1,868 ms | 1,860–2,056 ms | ±98 ms (±5.25%) |
| `/` CLS | 0.13 | 0.07–0.13 | ±0.03 (±22.86%) |
| `/` FCP | 1,868 ms | 1,860–2,056 ms | ±98 ms (±5.25%) |
| `/` TTFB | 3.80 ms | 2.20–10.50 ms | ±4.15 ms (±109.21%) |
| `/` max concurrent image requests | 0 | 0–0 | ±0 |
| `/` first image request and first 3 visible images painted | n/a; no images | n/a | n/a |
| `/` bytes transferred by 3 seconds | 162,447 bytes | 162,447–162,447 bytes | ±0 bytes (±0%) |
| `/briefing` LCP | 3,976 ms | 3,964–4,192 ms | ±114 ms (±2.87%) |
| `/briefing` CLS | 0 | 0–0 | ±0 |
| `/briefing` FCP | 1,848 ms | 1,836–1,876 ms | ±20 ms (±1.08%) |
| `/briefing` TTFB | 3.90 ms | 1.80–5.00 ms | ±1.60 ms (±41.03%) |
| `/briefing` max concurrent image requests | 0 | 0–0 | ±0 |
| `/briefing` first image request and first 3 visible images painted | n/a; no images | n/a | n/a |
| `/briefing` bytes transferred by 3 seconds | 157,849 bytes | 157,849–157,849 bytes | ±0 bytes (±0%) |

The LCP element was stable in all five runs: `p` on `/` and `p.labor-briefing__synthesis` on `/briefing`. The second unchanged-code dashboard set had a 1,860 ms median LCP, an 8 ms difference from baseline against the ±98 ms noise floor. Comparison mode marked LCP, CLS, FCP, TTFB, concurrency, and transferred-byte deltas not significant; image-only timings were correctly unavailable because the current pages contain no image resources. This same-commit check passed, so the observed error bars are useful for later A/B claims.

### Future consideration

These are synthetic headless measurements under scripted throttling. They are useful for A/B comparisons because the conditions and deltas are reproducible, but their absolute values will not match a particular real user. Core Web Vitals as measured in the field would require real-user monitoring on a deployed site, which is a different instrument and is not planned by this harness story.
