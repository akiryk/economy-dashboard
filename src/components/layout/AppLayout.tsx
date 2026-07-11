import type { ReactNode } from 'react'
import { AppHeader } from './AppHeader'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <AppHeader />
      <main className="app-main">{children}</main>
    </div>
  )
}
