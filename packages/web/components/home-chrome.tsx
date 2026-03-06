'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Github, PanelTopClose, PanelTopOpen, X } from 'lucide-react'

import { AppLaunchDrawer } from '@/components/app-launch-drawer'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'

const HERO_COLLAPSE_STORAGE_KEY = 'chowda:hero-collapsed'

type HomeChromeProps = {
  children: ReactNode
}

export function HomeChrome({ children }: HomeChromeProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    if (window.localStorage.getItem(HERO_COLLAPSE_STORAGE_KEY) === 'true') {
      setIsCollapsed(true)
    }
    setHasHydrated(true)
  }, [])

  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    window.localStorage.setItem(HERO_COLLAPSE_STORAGE_KEY, String(isCollapsed))
  }, [hasHydrated, isCollapsed])

  const toggleLabel = isCollapsed ? 'Show intro' : 'Hide intro'

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <p className="brand truncate text-2xl font-semibold sm:text-3xl">Chowda</p>
          <p className="text-sm text-muted">Calm reads and smarter discovery for Lobsters readers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCollapsed((current) => !current)}
            className="h-9 w-9 rounded-full p-0"
            aria-expanded={!isCollapsed}
            aria-controls="home-hero-card"
            aria-label={toggleLabel}
            title={toggleLabel}
          >
            {isCollapsed ? <PanelTopOpen className="h-4 w-4" aria-hidden /> : <PanelTopClose className="h-4 w-4" aria-hidden />}
          </Button>
          <Button asChild variant="outline" size="sm" className="h-9 w-9 rounded-full p-0">
            <a
              href="https://github.com/patsissons/chowda"
              target="_blank"
              rel="noreferrer"
              aria-label="Open Chowda on GitHub"
            >
              <Github className="h-4 w-4" aria-hidden />
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className={`hero-collapse ${isCollapsed ? 'hero-collapse--collapsed' : ''}`}>
        <div className="hero-collapse__inner">
          <section
            id="home-hero-card"
            className={`hero-collapse__panel relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-card transition-all duration-300 ease-out sm:p-8 ${
              isCollapsed ? 'pointer-events-none -translate-y-3 scale-[0.985] opacity-0' : 'translate-y-0 scale-100 opacity-100'
            }`}
            aria-hidden={isCollapsed}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="absolute right-3 top-3 z-10 h-9 w-9 rounded-full p-0 sm:right-4 sm:top-4"
              aria-label="Collapse intro"
              title="Collapse intro"
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>

            <div className="absolute -right-9 -top-8 h-24 w-24 rounded-full bg-accent/15 blur-2xl" />
            <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-accent/10 blur-3xl" />

            <p className="mb-4 inline-flex max-w-full truncate rounded-full border border-border bg-accentSoft px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted">
              It&apos;s pronounced <span className="mx-1 font-bold italic">“Chow-DAH!”</span>
            </p>

            <h1 className="mb-4 max-w-3xl text-balance text-3xl font-semibold leading-tight sm:text-5xl">
              A modern, minimal front door for Lobsters readers.
            </h1>

            <p className="max-w-3xl break-words text-base text-muted sm:text-lg">
              Chowda brings a cleaner, mobile-friendly Lobsters experience with focused reading, quick
              navigation, and room for community-powered utilities.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <AppLaunchDrawer />
              <a
                href="https://lobste.rs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-accentSoft"
              >
                Visit Lobsters
              </a>
            </div>
          </section>
        </div>
      </div>

      <div className={`transition-[margin] duration-300 ease-out ${isCollapsed ? 'mt-0' : 'mt-6'}`}>{children}</div>
    </>
  )
}
