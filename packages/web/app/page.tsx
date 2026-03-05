import Link from 'next/link'

import { ThemeToggle } from '@/components/theme-toggle'

const DEFAULT_TAB = 'hottest'
const PAGE_SIZE = 25

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

function normalizeTab(tab?: string): TabValue {
  return tab === DEFAULT_TAB ? DEFAULT_TAB : DEFAULT_TAB
}

function normalizePage(page?: string): number {
  const parsed = Number.parseInt(page ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function queryFor(tab: TabValue, page: number): string {
  const params = new URLSearchParams({ tab, page: String(page) })
  return `?${params.toString()}`
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

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const activeTab = normalizeTab(params.tab)
  const currentPage = normalizePage(params.page)

  let stories: LobstersStory[] = []
  let feedError: string | null = null

  try {
    stories = await fetchHottestStories(currentPage)
  } catch {
    feedError = 'Unable to load the hottest feed right now. Please try again shortly.'
  }

  const isFirstPage = currentPage === 1
  const hasNextPage = stories.length === PAGE_SIZE

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-14 pt-5 sm:px-6 sm:pt-8">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <p className="brand truncate text-2xl font-semibold sm:text-3xl">Chowda</p>
          <p className="text-sm text-muted">
            Calm reads and smarter discovery for Lobsters readers
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-8">
        <div className="absolute -right-9 -top-8 h-24 w-24 rounded-full bg-accent/15 blur-2xl" />
        <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-accent/10 blur-3xl" />

        <p className="mb-4 inline-flex max-w-full truncate rounded-full border border-border bg-accentSoft px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted">
          It's pronounced “<span className="font-bold mx-1 italic">Chow-DAH!</span>”
        </p>

        <h1 className="mb-4 max-w-3xl text-balance text-3xl font-semibold leading-tight sm:text-5xl">
          A modern, minimal front door for Lobsters readers.
        </h1>

        <p className="max-w-3xl break-words text-base text-muted sm:text-lg">
        Chowda brings a cleaner, mobile-friendly Lobsters experience with focused reading, quick navigation, and room for community-powered utilities.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a
            href="#"
            className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Open the app
          </a>
          <a
            href="https://lobste.rs"
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
              href={queryFor('hottest', 1)}
              role="tab"
              aria-selected={activeTab === 'hottest'}
              className="-mb-px inline-flex rounded-t-md border border-border border-b-surface bg-surface px-3 py-2 text-sm font-medium text-text"
            >
              🔥 Hottest
            </Link>
          </div>
        </div>

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

        <nav
          className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4"
          aria-label="Pagination"
        >
          {isFirstPage ? (
            <span className="rounded-md border border-border px-3 py-2 text-sm text-muted">
              Previous
            </span>
          ) : (
            <Link
              href={queryFor(activeTab, currentPage - 1)}
              className="rounded-md border border-border px-3 py-2 text-sm transition hover:bg-accentSoft"
            >
              Previous
            </Link>
          )}

          <p className="text-sm text-muted">Page {currentPage}</p>

          {hasNextPage ? (
            <Link
              href={queryFor(activeTab, currentPage + 1)}
              className="rounded-md border border-border px-3 py-2 text-sm transition hover:bg-accentSoft"
            >
              Next
            </Link>
          ) : (
            <span className="rounded-md border border-border px-3 py-2 text-sm text-muted">
              Next
            </span>
          )}
        </nav>
      </section>
    </main>
  )
}
