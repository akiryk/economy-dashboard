import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

interface CompactChartHelpProps {
  buttonLabel: string
  dialogLabel: string
  heading: string
  children: ReactNode
}

type HelpState = 'closed' | 'hover' | 'pinned'

export function CompactChartHelp({
  buttonLabel,
  dialogLabel,
  heading,
  children,
}: CompactChartHelpProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [state, setState] = useState<HelpState>('closed')
  const id = useId()
  const open = state !== 'closed'

  useEffect(() => {
    if (!open) return
    const dismissOnOutsidePointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setState('closed')
      }
    }
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setState('closed')
      buttonRef.current?.focus()
    }
    document.addEventListener('pointerdown', dismissOnOutsidePointer)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOnOutsidePointer)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [open])

  return (
    <div
      ref={containerRef}
      className="historical-band-chart__help"
      onMouseEnter={() => setState((current) =>
        current === 'closed' ? 'hover' : current)}
      onMouseLeave={() => setState((current) =>
        current === 'hover' ? 'closed' : current)}
    >
      <button
        ref={buttonRef}
        className="historical-band-chart__help-button"
        type="button"
        aria-label={buttonLabel}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setState((current) =>
          current === 'pinned' ? 'closed' : 'pinned')}
      >
        ?
      </button>
      {open && (
        <div
          className="historical-band-chart__help-popover"
          id={id}
          role="dialog"
          aria-label={dialogLabel}
        >
          <p><strong>{heading}</strong></p>
          <div>{children}</div>
        </div>
      )}
    </div>
  )
}
