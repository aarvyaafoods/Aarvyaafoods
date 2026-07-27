'use client'
import { useEffect } from 'react'
import { catalogApi } from '@/lib/api'
import { applyTheme, DEFAULT_THEME } from '@/lib/theme'

export default function ThemeProvider({ children }) {
  useEffect(() => {
    let cancelled = false
    const loadTheme = async () => {
      try {
        const theme = await catalogApi.theme()
        if (!cancelled) applyTheme(theme)
      } catch (_) {
        if (!cancelled) applyTheme(DEFAULT_THEME)
      }
    }
    loadTheme()
    window.addEventListener('staffarc-theme', loadTheme)
    return () => {
      cancelled = true
      window.removeEventListener('staffarc-theme', loadTheme)
    }
  }, [])

  return children
}
