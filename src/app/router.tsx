import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { App } from './App'
import { DashboardPage } from '../pages/DashboardPage'
import { BriefingPage } from '../pages/BriefingPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { GdpCompactChartPreviewRoute } from '../pages/GdpCompactChartPreviewRoute'
import { SecondaryPage } from '../pages/SecondaryPage'
import { StatusDashboardPage } from '../pages/StatusDashboardPage'

export const appRoutes: RouteObject[] = [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <DashboardPage /> },
        { path: 'briefing', element: <BriefingPage /> },
        { path: 'dashboard', element: <StatusDashboardPage /> },
        { path: 'secondary', element: <SecondaryPage /> },
        {
          path: 'previews/gdp-compact-chart',
          element: <GdpCompactChartPreviewRoute />,
        },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ]

export const router = createBrowserRouter(
  appRoutes,
  { basename: import.meta.env.BASE_URL },
)
