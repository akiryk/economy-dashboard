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
        title: 'How quickly are consumer prices rising?',
      },
      {
        id: 'inflation-drivers-card',
        title: 'What is driving inflation?',
      },
      {
        id: 'recent-inflation-momentum-card',
        title: 'Has inflation picked up in recent months?',
      },
      {
        id: 'wages-versus-inflation-card',
        title: 'Are workers’ wages keeping up with prices?',
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
        title: 'Are manufacturing output and jobs moving together?',
      },
      {
        id: 'real-business-investment-growth-card',
        title: 'Are businesses increasing investment in productive capacity?',
      },
      {
        id: 'corporate-profit-share-card',
        title: 'Are corporate profits growing relative to the economy?',
      },
      {
        id: 'industrial-capacity-utilization-card',
        title: 'How fully is industrial capacity being used?',
      },
    ],
  },
  {
    title: 'Financial conditions',
    cards: [
      { id: 'interest-rate-conditions-card', title: 'How do short-term and long-term interest rates compare?' },
      { id: 'broad-credit-conditions-card', title: 'Are credit conditions tighter or looser than usual?' },
      { id: 'bank-lending-standards-card', title: 'Are banks making it harder to borrow?' },
    ],
  },
  {
    title: 'Government finances',
    cards: [
      { id: 'federal-budget-balance-card', title: 'How large is the federal budget deficit or surplus relative to the economy?' },
      { id: 'federal-debt-held-by-public-card', title: 'How large is federal debt held by the public relative to the economy?' },
    ],
  },
  {
    title: 'Trade and tariffs',
    cards: [
      { id: 'trade-balance-share-of-gdp-card', title: 'How large is the U.S. trade balance relative to the economy?' },
      { id: 'effective-tariff-burden-card', title: 'What share of imported goods is collected as customs duties?' },
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
            26 cards in 9 categories
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
