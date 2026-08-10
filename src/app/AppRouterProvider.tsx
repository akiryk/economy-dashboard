import {
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom'

interface AppRouterProviderProps {
  router: ReturnType<typeof createBrowserRouter>
}

export function AppRouterProvider({ router }: AppRouterProviderProps) {
  // Transitions can leave the history URL ahead of the rendered route when
  // long-lived dashboard effects are still updating. Navigation is immediate.
  return <RouterProvider router={router} useTransitions={false} />
}
