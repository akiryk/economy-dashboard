import type { ReactNode } from 'react'

interface EconomicSectionProps {
  id: string
  title: string
  description: string
  children: ReactNode
}

export function EconomicSection({
  id,
  title,
  description,
  children,
}: EconomicSectionProps) {
  const headingId = `${id}-heading`
  const descriptionId = `${id}-description`

  return (
    <section
      id={id}
      className="economic-section"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
    >
      <header className="economic-section__header">
        <h2 id={headingId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
      </header>
      <div className="economic-section__content">{children}</div>
    </section>
  )
}
