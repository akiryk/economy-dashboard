import { useId, type ReactNode } from 'react'

interface DashboardTileProps {
  label: string
  state: 'notable-good' | 'normal' | 'notable-bad'
  children: ReactNode
  className?: string
}

export function DashboardTile({ label, state, children, className }: DashboardTileProps) {
  const labelId = useId()
  return (
    <article className={`status-tile${className ? ` ${className}` : ''}`} data-state={state} aria-labelledby={labelId}>
      <h2 className="status-tile__label" id={labelId}>{label}</h2>
      {children}
    </article>
  )
}
