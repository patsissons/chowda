'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 w-9 rounded-full p-0"
        aria-label="Toggle color mode"
      >
        <Sun className="h-4 w-4 opacity-0" aria-hidden />
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      variant="outline"
      size="sm"
      className="relative h-9 w-9 rounded-full p-0"
      aria-label="Toggle color mode"
    >
      <Sun
        className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0"
        aria-hidden
      />
      <Moon
        className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100"
        aria-hidden
      />
      <span className="sr-only">Toggle color mode</span>
    </Button>
  )
}
