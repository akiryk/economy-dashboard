const navigationGroups = [
  {
    title: 'Growth',
    cards: [
      { id: 'real-gdp-growth-card', title: 'Is the U.S. economy growing?' },
      {
        id: 'real-gdp-per-capita-growth-card',
        title: 'Is economic output growing faster than the population?',
      },
      {
        id: 'labor-productivity-growth-card',
        title: 'Is the economy producing more per hour worked?',
      },
    ],
  },
  {
    title: 'Prices',
    cards: [
      {
        id: 'headline-cpi-inflation-card',
        title: 'What’s the inflation rate?',
      },
      {
        id: 'recent-inflation-momentum-card',
        title: 'What is inflation doing recently?',
      },
      {
        id: 'wages-versus-inflation-card',
        title: 'Are workers’ wages keeping up with prices?',
      },
      {
        id: 'worker-purchasing-power-history-card',
        title: 'How has workers’ purchasing power changed over time?',
      },
      {
        id: 'inflation-drivers-card',
        title: 'What is driving inflation?',
      },
    ],
  },
  {
    title: 'Employment and income',
    cards: [
      {
        id: 'unemployment-rate-card',
        title: 'Is unemployment high or low?',
      },
      {
        id: 'prime-age-employment-ratio-card',
        title: 'What share of prime-age adults are employed?',
      },
      { id: 'payroll-growth-card', title: 'Are employers adding jobs?' },
      {
        id: 'job-growth-breakeven-card',
        title: 'Is job growth keeping up with the labor force?',
      },
      {
        id: 'initial-unemployment-claims-card',
        title: 'Are layoffs beginning to rise?',
      },
    ],
  },
  {
    title: 'Households',
    cards: [
      {
        id: 'personal-saving-rate-card',
        title: 'Are households saving less of their income?',
      },
    ],
  },
  {
    title: 'Housing',
    cards: [
      {
        id: 'home-ownership-cost-share-card',
        title: 'How much of a median household’s income would it take to own a typical home?',
      },
      {
        id: 'housing-starts-card',
        title: 'How much new housing is being started?',
      },
    ],
  },
  {
    title: 'Business and manufacturing',
    cards: [
      {
        id: 'manufacturing-output-versus-employment-card',
        title: 'Are U.S. manufacturers producing more goods?',
      },
      {
        id: 'real-business-investment-growth-card',
        title: 'Are businesses investing more in productive assets?',
      },
      {
        id: 'corporate-profit-share-card',
        title: 'How large are corporate profits relative to the economy?',
      },
    ],
  },
  {
    title: 'Financial conditions',
    cards: [
      { id: 'federal-funds-target-range-card', title: 'Where has the Fed set short-term interest rates?' },
      { id: 'interest-rate-conditions-card', title: 'Is the yield curve inverted?' },
      { id: 'mortgage-rate-30-year-card', title: 'How high are mortgage rates?' },
    ],
  },
  {
    title: 'Government finances',
    cards: [
      { id: 'federal-budget-balance-card', title: 'How large is the federal budget deficit relative to the economy?' },
      { id: 'federal-debt-held-by-public-card', title: 'How large is federal debt held by the public relative to the economy?' },
    ],
  },
  {
    title: 'Trade and tariffs',
    cards: [
      { id: 'trade-balance-share-of-gdp-card', title: 'How large is the U.S. trade deficit relative to the economy?' },
      { id: 'effective-tariff-burden-card', title: 'How heavily are imported goods being taxed?' },
    ],
  },
] as const

export function DashboardNavigation() {
  return (
    <section
      className="dashboard-navigation"
      aria-labelledby="dashboard-navigation-heading"
    >
      <details>
        <summary>
          <span id="dashboard-navigation-heading">Explore all indicators</span>
          <span className="dashboard-navigation__summary-detail">
            {navigationGroups.reduce((count, group) => count + group.cards.length, 0)} cards in 9 categories
          </span>
        </summary>
        <div className="dashboard-navigation__groups">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.cards.map((card) => (
                  <li key={card.id}>
                    <a href={`#${card.id}`}>{card.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </section>
  )
}
