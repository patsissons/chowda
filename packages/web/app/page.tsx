import Link from 'next/link'
import { Github } from 'lucide-react'

import { AppLaunchDrawer } from '@/components/app-launch-drawer'
import { PaginationControls } from '@/components/pagination-controls'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

const DEFAULT_TAB = 'hottest'
const APP_PAGE_SIZE = 10
const SOURCE_PAGE_SIZE = 25

type TabValue = 'hottest'

type SearchParams = {
  tab?: string
  page?: string
}

type LobstersStory = {
  short_id: string
  title: string
  url: string
  score: number
  comment_count: number
  created_at: string
  short_id_url: string
  comments_url: string
  submitter_user: string
}

type PagedStories = {
  stories: LobstersStory[]
  hasNextPage: boolean
}

function normalizeTab(tab?: string): TabValue {
  return tab === DEFAULT_TAB ? DEFAULT_TAB : DEFAULT_TAB
}

function normalizePage(page?: string): number {
  const parsed = Number.parseInt(page ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function domainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

async function fetchHottestStories(page: number): Promise<LobstersStory[]> {
  const response = await fetch(`https://lobste.rs/hottest.json?page=${page}`, {
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    throw new Error(`Failed to load hottest feed page ${page}`)
  }

  return (await response.json()) as LobstersStory[]
}

async function fetchStoriesForAppPage(page: number): Promise<PagedStories> {
  const startIndex = (page - 1) * APP_PAGE_SIZE
  const sourcePage = Math.floor(startIndex / SOURCE_PAGE_SIZE) + 1
  const offsetWithinSource = startIndex % SOURCE_PAGE_SIZE

  const firstSourcePage = await fetchHottestStories(sourcePage)
  let combinedStories = firstSourcePage.slice(offsetWithinSource)

  if (combinedStories.length < APP_PAGE_SIZE + 1) {
    const secondSourcePage = await fetchHottestStories(sourcePage + 1)
    combinedStories = [...combinedStories, ...secondSourcePage]
  }

  return {
    stories: combinedStories.slice(0, APP_PAGE_SIZE),
    hasNextPage: combinedStories.length > APP_PAGE_SIZE,
  }
}

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const activeTab = normalizeTab(params.tab)
  const currentPage = normalizePage(params.page)

  let stories: LobstersStory[] = []
  let hasNextPage = false
  let feedError: string | null = null

  try {
    const pagedStories = await fetchStoriesForAppPage(currentPage)
    stories = pagedStories.stories
    hasNextPage = pagedStories.hasNextPage
  } catch {
    feedError = 'Unable to load the hottest feed right now. Please try again shortly.'
  }

  const isFirstPage = currentPage === 1

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-14 pt-5 sm:px-6 sm:pt-8">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <p className="brand truncate text-2xl font-semibold sm:text-3xl">Chowda</p>
          <p className="text-sm text-muted">
            Calm reads and smarter discovery for Lobsters readers
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-8">
        <div className="absolute -right-9 -top-8 h-24 w-24 rounded-full bg-accent/15 blur-2xl" />
        <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-accent/10 blur-3xl" />

        <p className="mb-4 inline-flex max-w-full truncate rounded-full border border-border bg-accentSoft px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted">
          It's pronounced <span className="font-bold mx-1 italic">“Chow-DAH!”</span>
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

      <section className="mt-8 rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-6">
        <div className="mb-4 border-b border-border">
          <div className="flex items-center gap-2" role="tablist" aria-label="Feed tabs">
            <Link
              href="?tab=hottest&page=1"
              role="tab"
              aria-selected={activeTab === 'hottest'}
              className="-mb-px inline-flex rounded-t-md border border-border border-b-surface bg-surface px-3 py-2 text-sm font-medium text-text"
            >
              🔥 Hottest
            </Link>
          </div>
        </div>

        <PaginationControls
          tab={activeTab}
          currentPage={currentPage}
          isFirstPage={isFirstPage}
          hasNextPage={hasNextPage}
          className="mb-5 border-b border-border pb-4"
        />

        {feedError ? (
          <p className="rounded-lg border border-border bg-accentSoft p-3 text-sm text-text">
            {feedError}
          </p>
        ) : stories.length === 0 ? (
          <p className="text-sm text-muted">No stories found for this page.</p>
        ) : (
          <ol className="divide-y divide-border">
            {stories.map((story) => {
              const domain = domainFromUrl(story.url)
              return (
                <li key={story.short_id} className="py-4 first:pt-1">
                  <div className="flex min-w-0 flex-col gap-2">
                    <a
                      href={story.url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 break-words text-base font-medium text-text underline-offset-2 hover:underline"
                    >
                      {story.title}
                    </a>

                    <p className="min-w-0 break-words text-xs text-muted">
                      {story.score} points · {story.comment_count} comments · by{' '}
                      {story.submitter_user}
                      {domain ? ` · ${domain}` : ''}
                    </p>

                    <Link
                      href={story.comments_url}
                      className="w-fit text-xs text-accent underline-offset-2 hover:underline"
                    >
                      View discussion
                    </Link>
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        <PaginationControls
          tab={activeTab}
          currentPage={currentPage}
          isFirstPage={isFirstPage}
          hasNextPage={hasNextPage}
          className="mt-5 border-t border-border pt-4"
        />
      </section>
    </main>
  )
}
