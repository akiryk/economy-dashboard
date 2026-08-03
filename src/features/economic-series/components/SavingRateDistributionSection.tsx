import { useState, type CSSProperties } from "react";
import rawData from "../data/saving-rate-by-income-decile.json";
import {
  savingRateDeciles,
  type SavingRateDecileId,
} from "../models/savingRateDistribution";
import { validateSavingRateDistribution } from "../models/validateSavingRateDistribution";
import {
  buildLatestYearSummary,
  defaultSavingRateComparison,
  describeDistributionObservation,
  formatDistributionRate,
  latestValidDistributionYear,
} from "../utils/savingRateDistribution";
import "./savingRateDistribution.css";

const data = validateSavingRateDistribution(rawData);
const chartWidth = 900;
const chartHeight = 260;
const chartPadding = { top: 16, right: 28, bottom: 30, left: 52 };

function heatColor(rate: number | null): string {
  if (rate === null) return "var(--color-surface-muted)";
  if (Math.abs(rate) < 2) return "#f2efe7";
  if (rate < 0) {
    const opacity = Math.min(0.85, 0.18 + Math.abs(rate) / 180);
    return `rgb(181 82 67 / ${opacity})`;
  }
  const opacity = Math.min(0.82, 0.16 + rate / 75);
  return `rgb(42 112 128 / ${opacity})`;
}

function HeatMap() {
  const years = [...new Set(data.observations.map(({ year }) => year))];
  const [detail, setDetail] = useState("Select a cell for exact details.");
  return (
    <div className="saving-distribution__heatmap-wrap">
      <div
        className="saving-distribution__heatmap"
        style={{ "--saving-years": years.length } as CSSProperties}
        role="grid"
        aria-label="Personal saving rate by income decile and year"
      >
        <span aria-hidden="true" />
        {years.map((year, index) => (
          <span
            className="saving-distribution__year"
            key={year}
            aria-hidden="true"
          >
            {index % 4 === 0 || index === years.length - 1 ? year : ""}
          </span>
        ))}
        {savingRateDeciles.map((decile) => (
          <div
            className="saving-distribution__heat-row"
            role="row"
            key={decile.id}
          >
            <span className="saving-distribution__row-label" role="rowheader">
              {decile.label}
            </span>
            {years.map((year) => {
              const item = data.observations.find(
                (observation) =>
                  observation.year === year && observation.decile === decile.id,
              )!;
              const description = describeDistributionObservation(
                item.decile,
                item.year,
                item.rate,
                item.status,
              );
              return (
                <button
                  key={year}
                  type="button"
                  role="gridcell"
                  className="saving-distribution__cell"
                  style={{ background: heatColor(item.rate) }}
                  aria-label={description}
                  title={description}
                  onFocus={() => setDetail(description)}
                  onPointerEnter={() => setDetail(description)}
                  onClick={() => setDetail(description)}
                />
              );
            })}
          </div>
        ))}
      </div>
      <p className="saving-distribution__detail" aria-live="polite">
        {detail}
      </p>
    </div>
  );
}

function ComparisonChart() {
  const [selected, setSelected] = useState<readonly SavingRateDecileId[]>(
    defaultSavingRateComparison,
  );
  const [detail, setDetail] = useState(
    "Focus or select a point for exact details.",
  );
  const observations = data.observations.filter(({ decile }) =>
    selected.includes(decile),
  );
  const years = [...new Set(data.observations.map(({ year }) => year))];
  const values = observations.flatMap(({ rate }) =>
    rate === null ? [] : [rate],
  );
  const minimum = Math.floor(Math.min(0, ...values) / 25) * 25;
  const maximum = Math.ceil(Math.max(0, ...values) / 25) * 25;
  const x = (year: number) =>
    chartPadding.left +
    ((year - years[0]!) / (years.at(-1)! - years[0]!)) *
      (chartWidth - chartPadding.left - chartPadding.right);
  const y = (rate: number) =>
    chartPadding.top +
    ((maximum - rate) / (maximum - minimum)) *
      (chartHeight - chartPadding.top - chartPadding.bottom);
  const colors = ["#1f6576", "#a75d3d", "#6d5b8c"];
  const toggle = (id: SavingRateDecileId) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 3
          ? [...current, id]
          : current,
    );

  return (
    <section
      className="saving-distribution__comparison"
      aria-labelledby="saving-distribution-comparison-title"
    >
      <h5 id="saving-distribution-comparison-title">
        Compare income groups over time
      </h5>
      <fieldset>
        <legend>Choose up to three income groups</legend>
        <p id="saving-selection-limit">
          Three groups maximum. Clear one selection to choose another.
        </p>
        <div className="saving-distribution__controls">
          {savingRateDeciles.map(({ id, label }) => (
            <label key={id}>
              <input
                type="checkbox"
                checked={selected.includes(id)}
                disabled={!selected.includes(id) && selected.length >= 3}
                aria-describedby="saving-selection-limit"
                onChange={() => toggle(id)}
              />{" "}
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="saving-distribution__legend" aria-hidden="true">
        {selected.map((id, index) => (
          <span key={id}>
            <i style={{ background: colors[index] }} />
            {savingRateDeciles.find((item) => item.id === id)!.label}
          </span>
        ))}
      </div>
      <svg
        className="saving-distribution__line-chart"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label="Selected income groups' annual personal saving rates"
      >
        <line
          x1={chartPadding.left}
          x2={chartWidth - chartPadding.right}
          y1={y(0)}
          y2={y(0)}
          className="saving-distribution__zero-line"
        />
        <text x={chartPadding.left - 8} y={y(0) + 4} textAnchor="end">
          0%
        </text>
        {selected.map((decile, seriesIndex) => {
          const series = data.observations.filter(
            (item) => item.decile === decile,
          );
          const segments: string[] = [];
          let segment = "";
          for (const item of series) {
            if (item.rate === null) {
              if (segment) segments.push(segment);
              segment = "";
              continue;
            }
            segment += `${segment ? " L" : "M"} ${x(item.year)} ${y(item.rate)}`;
          }
          if (segment) segments.push(segment);
          return (
            <g key={decile}>
              {segments.map((pathData, index) => (
                <path
                  key={index}
                  d={pathData}
                  fill="none"
                  stroke={colors[seriesIndex]}
                  strokeWidth="3"
                />
              ))}
              {series.map((item) =>
                item.rate === null ? null : (
                  <circle
                    key={item.year}
                    cx={x(item.year)}
                    cy={y(item.rate)}
                    r="5"
                    fill={colors[seriesIndex]}
                    tabIndex={0}
                    role="button"
                    aria-label={describeDistributionObservation(
                      item.decile,
                      item.year,
                      item.rate,
                      item.status,
                    )}
                    onFocus={() =>
                      setDetail(
                        describeDistributionObservation(
                          item.decile,
                          item.year,
                          item.rate,
                          item.status,
                        ),
                      )
                    }
                    onPointerEnter={() =>
                      setDetail(
                        describeDistributionObservation(
                          item.decile,
                          item.year,
                          item.rate,
                          item.status,
                        ),
                      )
                    }
                    onClick={() =>
                      setDetail(
                        describeDistributionObservation(
                          item.decile,
                          item.year,
                          item.rate,
                          item.status,
                        ),
                      )
                    }
                  >
                    <title>
                      {describeDistributionObservation(
                        item.decile,
                        item.year,
                        item.rate,
                        item.status,
                      )}
                    </title>
                  </circle>
                ),
              )}
            </g>
          );
        })}
        <text x={chartPadding.left} y={chartHeight - 5}>
          {years[0]}
        </text>
        <text
          x={chartWidth - chartPadding.right}
          y={chartHeight - 5}
          textAnchor="end"
        >
          {years.at(-1)}
        </text>
      </svg>
      <p className="saving-distribution__detail" aria-live="polite">
        {detail}
      </p>
    </section>
  );
}

function LatestYearChart() {
  const year = latestValidDistributionYear(data)!;
  const items = data.observations.filter((item) => item.year === year);
  const minimum = Math.min(
    0,
    ...items.flatMap(({ rate }) => (rate === null ? [] : [rate])),
  );
  const maximum = Math.max(
    0,
    ...items.flatMap(({ rate }) => (rate === null ? [] : [rate])),
  );
  const zero = (Math.abs(minimum) / (maximum - minimum)) * 100;
  return (
    <section
      className="saving-distribution__latest"
      aria-labelledby="saving-distribution-latest-title"
    >
      <h5 id="saving-distribution-latest-title">
        Saving rates in the latest available year
      </h5>
      <p>{year}</p>
      <div className="saving-distribution__bars">
        {items.map((item) => {
          const rate = item.rate;
          const description = describeDistributionObservation(
            item.decile,
            item.year,
            rate,
            item.status,
          );
          const position =
            rate === null
              ? zero
              : ((rate - minimum) / (maximum - minimum)) * 100;
          return (
            <div className="saving-distribution__bar-row" key={item.decile}>
              <span>
                {savingRateDeciles.find(({ id }) => id === item.decile)!.label}
              </span>
              <div
                className="saving-distribution__bar-track"
                style={{ "--saving-zero": `${zero}%` } as CSSProperties}
              >
                <button
                  type="button"
                  className="saving-distribution__dot"
                  style={{ left: `${position}%` }}
                  aria-label={description}
                  title={description}
                />
              </div>
              <strong>{formatDistributionRate(rate)}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function SavingRateDistributionSection() {
  return (
    <section
      className="saving-distribution"
      aria-labelledby="saving-distribution-title"
    >
      <h4 id="saving-distribution-title">How saving differs by income</h4>
      <p>
        Latest distributional saving data: 2023. These annual estimates are
        released substantially later than the monthly national saving rate.
      </p>
      <p>
        Annual estimates show the share of disposable personal income saved by
        each income decile. Negative values mean the group’s estimated outlays
        exceeded its disposable income during that year. This does not
        necessarily mean households took on more debt; they may also have drawn
        on cash balances, sold assets, or used other accumulated savings.
      </p>
      <div
        className="saving-distribution__scale"
        aria-label="Saving-rate color scale"
      >
        <span>Negative saving</span>
        <i />
        <strong>Zero</strong>
        <i />
        <span>Positive saving</span>
      </div>
      <p className="saving-distribution__zero-label">
        Zero = estimated outlays matched disposable income
      </p>
      <HeatMap />
      <p className="visually-hidden">{buildLatestYearSummary(data)}</p>
      <ComparisonChart />
      <LatestYearChart />
      <p>
        These annual estimates show how saving is distributed across income
        groups. They are not the same as the monthly aggregate saving rate and
        are released with a longer lag.
      </p>
      <details className="supporting-disclosure">
        <summary>About distributional saving estimates</summary>
        <p>
          The saving rate is personal saving divided by disposable personal
          income. A negative rate means estimated annual outlays exceeded
          disposable income for that group; it does not mean every household in
          the group dissaved. Income groups follow BEA’s distributional
          methodology and rank households by equivalized disposable personal
          income. These annual statistics combine national accounts with survey
          and administrative distributional source data, so the latest year lags
          the monthly aggregate series and aggregate results can differ from a
          typical household’s experience. BEA may revise the estimates as source
          data or methods change. A lower rate alone does not show whether
          households borrowed, sold assets, or used cash balances.
        </p>
      </details>
      <p className="series-source">
        Source:{" "}
        <a href={data.sourceUrl} target="_blank" rel="noreferrer">
          U.S. Bureau of Economic Analysis, Distribution of Personal Saving
        </a>{" "}
        ({data.retrievedAt}; {latestValidDistributionYear(data)} latest valid
        year).
      </p>
    </section>
  );
}
