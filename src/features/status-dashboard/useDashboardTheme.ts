import { useEffect, useState } from 'react'

export type DashboardThemePreference = 'system' | 'light' | 'dark'

const storageKey = 'economy-dashboard-theme'

function savedPreference(): DashboardThemePreference {
  const saved = window.localStorage.getItem(storageKey)
  return saved === 'light' || saved === 'dark' ? saved : 'system'
}

export function useDashboardTheme() {
  const [preference, setPreference] = useState<DashboardThemePreference>(savedPreference)
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemTheme(media.matches ? 'dark' : 'light')
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const updatePreference = (next: DashboardThemePreference) => {
    setPreference(next)
    if (next === 'system') window.localStorage.removeItem(storageKey)
    else window.localStorage.setItem(storageKey, next)
  }

  return {
    preference,
    resolvedTheme: preference === 'system' ? systemTheme : preference,
    setPreference: updatePreference,
  }
}
