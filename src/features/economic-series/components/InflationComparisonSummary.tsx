import { lazy, Suspense, useMemo, useState } from "react";
import type { EconomicSeries } from "../models/economicSeries";
import type { TimeRange } from "../utils/chartData";
import {
  alignInflationObservations,
  calculateInflationComparisonSummary,
  coreValueThreeMonthsEarlier,
  filterInflationComparisonByTimeRange,
  latestSharedInflationObservation,
} from "../utils/inflationComparisonData";
import {
  formatDate,
  formatObservationPeriod,
  formatPercentage,
  formatSignedPercentage,
} from "../utils/economicSeries";
import { InflationComparisonTable } from "./InflationComparisonTable";
import { TimeRangeControl } from "./TimeRangeControl";
import { HistoricalZoomControls } from "./HistoricalZoomControls";
import { useHistoricalZoom } from "./useHistoricalZoom";

const EconomicTimeSeriesChart = lazy(
  () => import("../charts/EconomicTimeSeriesChart"),
);

interface InflationComparisonSummaryProps {
  core: EconomicSeries;
  headline: EconomicSeries;
  variant: "momentum" | "year-over-year";
}

export function InflationComparisonSummary({
  core,
  headline,
  variant,
}: InflationComparisonSummaryProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("20y");
  const aligned = useMemo(
    () => alignInflationObservations(headline, core),
    [core, headline],
  );
  const selected = useMemo(
    () => filterInflationComparisonByTimeRange(aligned, selectedRange),
    [aligned, selectedRange],
  );
  const zoom = useHistoricalZoom(selected, selectedRange, "monthly", setSelectedRange);
  const visible = zoom.visibleItems;
  const summary = useMemo(
    () => calculateInflationComparisonSummary(visible),
    [visible],
  );
  const latest = latestSharedInflationObservation(visible);
  const latestAvailable = latestSharedInflationObservation(aligned);
  const priorCore = latest
    ? coreValueThreeMonthsEarlier(aligned, latest.date)
    : null;
  const momentum = variant === "momentum";
  const id = momentum
    ? "recent-inflation-momentum"
    : "headline-versus-core-inflation";
  const title = momentum
    ? "Recent Inflation Momentum"
    : "Headline Versus Core CPI";
  const question = momentum
    ? "Is inflation currently accelerating or slowing?"
    : "Is inflation broad and persistent?";
  const latestLabel = momentum
    ? "Latest three-month annualized core inflation"
    : "Latest core CPI inflation";
  const coverageStart = aligned[0];
  const coverageEnd = aligned.at(-1);

  return (
    <article
      id={`${id}-card`}
      className="series-card"
      aria-labelledby={`${id}-question`}
    >
      <header className="series-card__header">
        <p className="series-card__eyebrow">Inflation comparison</p>
        <h3 id={`${id}-question`}>{question}</h3>
        <p className="series-card__title">{title}</p>
      </header>

      <div className="series-current" aria-label={latestLabel}>
        <p className="series-current__value">
          {formatSignedPercentage(latestAvailable?.core ?? null)}
        </p>
        <p className="series-current__label">{latestLabel}</p>
        <p className="series-current__period">
          {latestAvailable
            ? formatObservationPeriod(latestAvailable.date, "monthly")
            : "Observation period unavailable"}{" "}
          · {momentum ? "Annualized percent" : "Percent change from year ago"}
        </p>
        <p className="series-current__comparison">
          Corresponding headline rate:{" "}
          {formatSignedPercentage(latestAvailable?.headline ?? null)}
        </p>
      </div>

      <TimeRangeControl
        selectedRange={selectedRange}
        onRangeChange={zoom.selectPreset}
        contextLabel={title}
      />
      <HistoricalZoomControls active={zoom.active} visiblePeriod={zoom.visiblePeriod} onMove={zoom.move} onResize={zoom.resize} onReset={zoom.reset} />

      {summary.observationCount > 0 ? (
        <>
          <Suspense
            fallback={
              <p className="chart-state">Loading chart visualization…</p>
            }
          >
            <EconomicTimeSeriesChart
              key={selectedRange}
              kind="inflation-comparison"
              variant={variant}
              headlineObservations={selected.map((item) => ({
                date: item.date,
                value: item.headline,
              }))}
              coreObservations={selected.map((item) => ({
                date: item.date,
                value: item.core,
              }))}
              frequency="monthly"
              zoomStartDate={visible[0]?.date ?? ""}
              zoomEndDate={visible.at(-1)?.date ?? ""}
              onZoomChange={zoom.onChartZoom}
            />
          </Suspense>
          <p className="chart-summary" aria-live="polite">
            <strong>Data unavailable</strong>: October 2025 – January 2026 CPI
            collection was disrupted by the federal government shutdown.
            Three-month momentum resumes once a continuous four-month sequence
            is available.
          </p>
          <p className="chart-summary" aria-live="polite">
            In{" "}
            {latest
              ? formatObservationPeriod(latest.date, "monthly")
              : "an unavailable month"}
            , the headline rate was {formatPercentage(latest?.headline ?? null)}{" "}
            and the core rate was {formatPercentage(latest?.core ?? null)}.
            {!momentum && (
              <>
                {" "}
                Core was{" "}
                {latest?.difference !== null &&
                latest?.difference !== undefined &&
                latest.difference >= 0
                  ? "above"
                  : "below"}{" "}
                headline by {formatSignedPercentage(latest?.difference ?? null)}{" "}
                percentage points.
              </>
            )}{" "}
            Core ranged from {formatPercentage(summary.minimum?.value ?? null)}{" "}
            in{" "}
            {summary.minimum
              ? formatObservationPeriod(summary.minimum.date, "monthly")
              : "an unavailable month"}{" "}
            to {formatPercentage(summary.maximum?.value ?? null)} in{" "}
            {summary.maximum
              ? formatObservationPeriod(summary.maximum.date, "monthly")
              : "an unavailable month"}
            .
            {momentum && (
              <>
                {" "}
                The latest core rate was{" "}
                {formatPercentage(latest?.core ?? null)}, compared with{" "}
                {formatPercentage(priorCore)} three months earlier.
              </>
            )}
          </p>
        </>
      ) : (
        <p className="chart-state">
          No aligned inflation observations are available.
        </p>
      )}

      <div className="series-explanations">
        <section>
          <h4>What this tells you</h4>
          <p>
            {momentum
              ? "Three-month annualized inflation reacts more quickly than a year-over-year rate. It shows the pace implied by price changes over the latest three months if that pace continued for a full year."
              : "Headline CPI includes the full consumer basket. Core CPI excludes food and energy, which can be especially volatile. Comparing them helps show whether recent inflation is concentrated in those categories or is also present across the rest of the basket."}
          </p>
        </section>
        <section>
          <h4>What this leaves out</h4>
          <p>
            {momentum
              ? "This measure is not a forecast and can move sharply because of a few unusual months. Year-over-year inflation provides a more stable view, while the three-month annualized rate provides a more responsive one."
              : "Core CPI still includes many categories that can move unevenly, and excluding food and energy does not make those costs irrelevant to households. CPI is a national average and may not match an individual household’s expenses."}
          </p>
        </section>
      </div>

      <section className="related-indicators" aria-labelledby={`${id}-related`}>
        <h4 id={`${id}-related`}>Consider alongside</h4>
        <ul>
          <li>Headline CPI inflation</li>
          <li>{momentum ? "Core CPI inflation" : "Inflation momentum"}</li>
          <li>Wage growth</li>
        </ul>
      </section>

      <footer className="series-supporting">
        <p className="series-source">
          Sources:{" "}
          <a href={headline.sourceUrl} rel="noreferrer" target="_blank">
            Headline CPI via FRED
          </a>
          {"; "}
          <a href={core.sourceUrl} rel="noreferrer" target="_blank">
            Core CPI via FRED
          </a>
        </p>
        <details className="supporting-disclosure">
          <summary>Series details</summary>
          <dl className="series-metadata">
            <div>
              <dt>Headline series</dt>
              <dd>{headline.providerSeriesId} · {headline.seasonalAdjustment}</dd>
            </div>
            <div>
              <dt>Core series</dt>
              <dd>CPILFESL</dd>
            </div>
            <div>
              <dt>Frequency</dt>
              <dd>Monthly</dd>
            </div>
            <div>
              <dt>Transformation</dt>
              <dd>{core.transformation}</dd>
            </div>
            <div>
              <dt>Retrieved</dt>
              <dd>{formatDate(core.retrievedAt)}</dd>
            </div>
            <div>
              <dt>Observation coverage</dt>
              <dd>
                {coverageStart && coverageEnd
                  ? `${formatObservationPeriod(coverageStart.date, "monthly")} to ${formatObservationPeriod(coverageEnd.date, "monthly")}`
                  : "Not available"}
              </dd>
            </div>
          </dl>
        </details>
        <details className="supporting-disclosure">
          <summary>Recent observations</summary>
          <InflationComparisonTable observations={visible} variant={variant} />
        </details>
      </footer>
    </article>
  );
}
