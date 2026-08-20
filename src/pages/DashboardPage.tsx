import { EconomicSection } from "../components/layout/EconomicSection";
import { DashboardNavigation } from "../components/layout/DashboardNavigation";
import { EconomicSeriesCard } from "../features/economic-series/components/EconomicSeriesCard";
import { JobGrowthBreakevenCard } from "../features/economic-series/components/JobGrowthBreakevenCard";

const payrollSupportingSlugs = ["monthly-payroll-change"] as const;
const weeklyClaimsSupportingSlugs = ["initial-unemployment-claims"] as const;
const claimsComparisonSupportingSlugs = [
  "initial-unemployment-claims-four-week-average",
  ...weeklyClaimsSupportingSlugs,
] as const;
const wageComparisonSupportingSlugs = [
  "nominal-wage-growth",
  "headline-cpi-inflation-seasonally-adjusted",
] as const;
const purchasingPowerSupportingSlugs = [
  "real-hourly-purchasing-power-change-4-year",
  "real-hourly-purchasing-power-change-20-year",
  "production-worker-hourly-earnings",
  "cpi-w-index-seasonally-adjusted",
] as const;
const cpiSupportingSlugs = [
  "headline-pce-inflation",
  "core-cpi-inflation",
] as const;
const inflationDriverSupportingSlugs = [
  "shelter-cpi-inflation",
  "energy-cpi-inflation",
  "food-cpi-inflation",
] as const;
const headlineMomentumSupportingSlugs = [
  "headline-cpi-inflation",
  "core-cpi-inflation",
  "core-cpi-three-month-annualized",
  "headline-cpi-index-not-seasonally-adjusted",
  "headline-cpi-index-seasonally-adjusted",
] as const;
const yieldCurveSupportingSlugs = [
  "three-month-treasury-bill-rate",
  "effective-federal-funds-rate",
] as const;
const housingStartsSupportingSlugs = ["us-population-monthly"] as const;
const policyRateSupportingSlugs = [
  "federal-funds-target-upper-bound",
  "federal-funds-target-rate-historical",
  "bank-prime-loan-rate",
  "daily-effective-federal-funds-rate",
] as const;

export function DashboardPage() {
  return (
    <div className="page">
      <section className="page-intro" aria-labelledby="dashboard-heading">
        <h1 id="dashboard-heading">U.S. Economy, August 13, 2026</h1>
      </section>

      <DashboardNavigation />

      <EconomicSection
        id="growth"
        title="Growth"
      >
        <EconomicSeriesCard
          collapsible
          slug="real-gdp-growth"
          label="real GDP"
        />
        <EconomicSeriesCard
          collapsible
          slug="real-gdp-per-capita-growth"
          label="real GDP per capita"
        />
        <EconomicSeriesCard
          collapsible
          slug="labor-productivity-growth"
          label="labor productivity"
        />
      </EconomicSection>

      <EconomicSection
        id="prices"
        title="Prices"
      >
        <EconomicSeriesCard
          collapsible
          slug="headline-cpi-inflation"
          supportingSlugs={cpiSupportingSlugs}
          label="headline CPI inflation"
        />
        <EconomicSeriesCard
          slug="headline-cpi-three-month-annualized"
          supportingSlugs={headlineMomentumSupportingSlugs}
          label="recent inflation momentum"
          variant="inflation-momentum"
        />
        <EconomicSeriesCard
          slug="real-wage-growth"
          supportingSlugs={wageComparisonSupportingSlugs}
          label="wages versus inflation"
          variant="wages-comparison"
        />
        <EconomicSeriesCard
          slug="real-hourly-purchasing-power-change-10-year"
          supportingSlugs={purchasingPowerSupportingSlugs}
          label="long-run worker purchasing power"
          variant="purchasing-power"
        />
        <EconomicSeriesCard
          slug="headline-cpi-inflation"
          supportingSlugs={inflationDriverSupportingSlugs}
          label="inflation drivers"
          variant="inflation-drivers"
        />
      </EconomicSection>

      <EconomicSection
        id="employment-and-income"
        title="Employment and income"
      >
        <EconomicSeriesCard
          collapsible
          slug="unemployment-rate"
          label="unemployment rate"
        />
        <EconomicSeriesCard
          collapsible
          slug="prime-age-employment-ratio"
          label="prime-age employment-to-population ratio"
        />
        <EconomicSeriesCard
          collapsible
          slug="payroll-growth"
          supportingSlugs={payrollSupportingSlugs}
          label="payroll growth"
        />
        <JobGrowthBreakevenCard />
        <EconomicSeriesCard
          slug="jolts-layoffs-and-discharges-rate"
          supportingSlugs={claimsComparisonSupportingSlugs}
          label="layoffs and initial unemployment claims"
          variant="claims-comparison"
        />
      </EconomicSection>

      <EconomicSection
        id="households"
        title="Households"
      >
        <EconomicSeriesCard
          collapsible
          slug="personal-saving-rate"
          label="personal saving rate"
        />
      </EconomicSection>

      <EconomicSection
        id="housing"
        title="Housing"
      >
        <EconomicSeriesCard
          collapsible
          slug="home-ownership-cost-share"
          label="home-ownership affordability"
        />
        <EconomicSeriesCard
          collapsible
          slug="housing-starts"
          supportingSlugs={housingStartsSupportingSlugs}
          label="housing starts"
        />
      </EconomicSection>

      <EconomicSection
        id="business-and-manufacturing"
        title="Business and manufacturing"
      >
        <EconomicSeriesCard
          collapsible
          slug="manufacturing-output"
          label="manufacturing production growth"
        />
        <EconomicSeriesCard
          collapsible
          slug="real-business-investment-growth"
          supportingSlugs={["real-business-investment-level"]}
          label="real business investment growth"
        />
        <EconomicSeriesCard
          collapsible
          slug="corporate-profit-share"
          label="corporate profit share"
        />
      </EconomicSection>

      <EconomicSection
        id="financial-conditions"
        title="Financial conditions"
      >
        <EconomicSeriesCard
          collapsible
          slug="federal-funds-target-lower-bound"
          supportingSlugs={policyRateSupportingSlugs}
          label="Federal funds target range"
          variant="policy-rate"
        />
        <EconomicSeriesCard
          collapsible
          slug="ten-year-treasury-yield"
          supportingSlugs={yieldCurveSupportingSlugs}
          label="yield curve"
          variant="rate-comparison"
        />
        <EconomicSeriesCard
          slug="mortgage-rate-30-year"
          label="30-year fixed mortgage rate"
          variant="mortgage-rate"
        />
      </EconomicSection>

      <EconomicSection
        id="government-finances"
        title="Government finances"
      >
        <EconomicSeriesCard
          collapsible
          slug="federal-budget-balance"
          label="federal budget balance"
        />
        <EconomicSeriesCard
          collapsible
          slug="federal-debt-held-by-public"
          label="federal debt held by the public"
        />
      </EconomicSection>

      <EconomicSection
        id="trade-and-tariffs"
        title="Trade and tariffs"
      >
        <EconomicSeriesCard
          collapsible
          slug="trade-balance-share-of-gdp"
          supportingSlugs={[
            "trade-goods-exports",
            "trade-goods-imports",
            "trade-services-exports",
            "trade-services-imports",
          ]}
          label="trade balance"
        />
        <EconomicSeriesCard
          collapsible
          slug="effective-tariff-burden"
          supportingSlugs={["core-goods-pce-inflation"]}
          label="effective tariff burden"
        />
      </EconomicSection>
    </div>
  );
}
