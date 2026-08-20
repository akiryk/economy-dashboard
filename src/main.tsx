import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { router } from './app/router'
import { AppRouterProvider } from './app/AppRouterProvider'
import './styles/tokens.css'
import './styles/global.css'
import { FreshnessProvider } from './features/data-freshness/FreshnessContext'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element was not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <FreshnessProvider>
      <AppRouterProvider router={router} />
    </FreshnessProvider>
  </StrictMode>,
)
