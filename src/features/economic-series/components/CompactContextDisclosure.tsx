import { useId, useState, type ReactNode } from 'react'

interface CompactContextDisclosureProps {
  accessibleSubject: string
  children: ReactNode
}

export function CompactContextDisclosure({
  accessibleSubject,
  children,
}: CompactContextDisclosureProps) {
  const [expanded, setExpanded] = useState(false)
  const contentId = `${useId()}-compact-context`
  const label = expanded ? 'Hide context' : 'Why this matters'

  return (
    <div className="compact-context-disclosure">
      <button
        type="button"
        className="compact-context-disclosure__toggle"
        aria-expanded={expanded}
        aria-controls={contentId}
        aria-label={`${label} for ${accessibleSubject}`}
        onClick={() => setExpanded((current) => !current)}
      >
        {label}
        <span aria-hidden="true" className="compact-context-disclosure__chevron">
          {expanded ? '⌃' : '⌄'}
        </span>
      </button>
      {expanded && (
        <div className="compact-context-disclosure__content" id={contentId}>
          {children}
        </div>
      )}
    </div>
  )
}
