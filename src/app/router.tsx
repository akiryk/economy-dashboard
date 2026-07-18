import { createBrowserRouter } from 'react-router-dom'
import { App } from './App'
import { DashboardPage } from '../pages/DashboardPage'
import { BriefingPage } from '../pages/BriefingPage'
import { NotFoundPage } from '../pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'briefing', element: <BriefingPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
