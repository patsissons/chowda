'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        type="button"
        className="h-9 w-9 rounded-full border border-border bg-surface"
        aria-label="Toggle color mode"
      />
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="h-9 w-9 rounded-full border border-border bg-surface text-sm text-text transition hover:bg-accentSoft"
      aria-label="Toggle color mode"
    >
      <span aria-hidden>{isDark ? '☼' : '☾'}</span>
    </button>
  )
}
