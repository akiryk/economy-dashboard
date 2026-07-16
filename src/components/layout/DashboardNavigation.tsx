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
        id: 'labor-productivity-level-card',
        title: 'How much more productive is the economy than in the past?',
      },
      {
        id: 'labor-productivity-growth-card',
        title: 'Are productivity gains revving up or slowing down?',
      },
    ],
  },
  {
    title: 'Prices',
    cards: [
      {
        id: 'headline-cpi-inflation-card',
        title: 'How quickly are consumer prices rising?',
      },
      {
        id: 'headline-versus-core-inflation-card',
        title: 'Is inflation broad and persistent?',
      },
      {
        id: 'recent-inflation-momentum-card',
        title: 'Is inflation currently accelerating or slowing?',
      },
    ],
  },
  {
    title: 'Employment and income',
    cards: [
      {
        id: 'unemployment-rate-card',
        title: 'How difficult is it for people who want work to find it?',
      },
      {
        id: 'prime-age-employment-ratio-card',
        title: 'What share of prime-age adults are employed?',
      },
      { id: 'payroll-growth-card', title: 'Are employers adding jobs?' },
      {
        id: 'wages-versus-inflation-card',
        title: 'Are workers’ wages keeping up with prices?',
      },
    ],
  },
  {
    title: 'Households',
    cards: [
      {
        id: 'real-income-versus-spending-card',
        title: 'Are household incomes and spending growing after inflation?',
      },
      {
        id: 'personal-saving-rate-card',
        title: 'Are households saving or drawing down more of their income?',
      },
      {
        id: 'household-debt-service-ratio-card',
        title: 'How much of household income is going toward required debt payments?',
      },
    ],
  },
  {
    title: 'Housing',
    cards: [
      {
        id: 'home-ownership-cost-share-card',
        title: 'Can a median-income household afford a typical home?',
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
        title: 'Are manufacturing output and jobs moving together?',
      },
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
            17 cards in 6 categories
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
