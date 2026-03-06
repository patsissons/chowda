import Link from 'next/link'
import { Github } from 'lucide-react'

import { AppLaunchDrawer } from '@/components/app-launch-drawer'
import { PaginationControls } from '@/components/pagination-controls'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

const DEFAULT_TAB = 'hottest'
const APP_PAGE_SIZE = 10
const SOURCE_PAGE_SIZE = 25
const LOBSTERS_BASE_URL = 'https://lobste.rs'

type TabValue = 'hottest' | 'newest' | 'active' | 'search'

type SearchParams = {
  tab?: string
  page?: string
  q?: string
}

type LobstersStory = {
  short_id: string
  title: string
  url: string
  score: number
  comment_count: number
  comments_url: string
  submitter_user: string
}

type PagedStories = {
  stories: LobstersStory[]
  hasNextPage: boolean
}

function normalizeQuery(query?: string): string | null {
  const trimmed = (query ?? '').trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeTab(tab: string | undefined, query: string | null): TabValue {
  if (tab === 'newest' || tab === 'active' || tab === 'hottest') {
    return tab
  }

  if (tab === 'search' && query) {
    return 'search'
  }

  return DEFAULT_TAB
}

function normalizePage(page?: string): number {
  const parsed = Number.parseInt(page ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function queryFor(tab: TabValue, page: number, searchQuery?: string | null): string {
  const params = new URLSearchParams({ tab, page: String(page) })
  if (tab === 'search' && searchQuery) {
    params.set('q', searchQuery)
  }
  return `?${params.toString()}`
}

function domainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function htmlToText(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function joinUrl(baseUrl: string, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl
  }
  return `${baseUrl}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

function parseSearchHtml(html: string): LobstersStory[] {
  const blocks = html.split('<li id="story_').slice(1)
  const results: LobstersStory[] = []

  for (const block of blocks) {
    const end = block.indexOf('</li>')
    if (end === -1) {
      continue
    }

    const item = block.slice(0, end)
    const shortIdMatch = item.match(/data-shortid="([^"]+)"/)
    const linkMatch = item.match(/<span[^>]*class="link[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/)
    const submitterMatch = item.match(/<a class="u-author[^>]*>([^<]+)<\/a>/)
    const commentsMatch = item.match(
      /<span class="comments_label">[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?(\d+)\s+comments?/,
    )
    const scoreMatch = item.match(/<a class="upvoter"[^>]*>(\d+|~)<\/a>/)

    if (!shortIdMatch || !linkMatch || !submitterMatch) {
      continue
    }

    results.push({
      short_id: shortIdMatch[1],
      title: htmlToText(linkMatch[2]),
      url: joinUrl(LOBSTERS_BASE_URL, htmlToText(linkMatch[1])),
      score: scoreMatch && scoreMatch[1] !== '~' ? Number(scoreMatch[1]) : 0,
      submitter_user: htmlToText(submitterMatch[1]),
      comment_count: commentsMatch ? Number(commentsMatch[2]) : 0,
      comments_url: commentsMatch ? joinUrl(LOBSTERS_BASE_URL, htmlToText(commentsMatch[1])) : '',
    })
  }

  return results
}

function feedUrlFor(tab: Exclude<TabValue, 'search'>, page: number): string {
  if (tab === 'newest') {
    return `${LOBSTERS_BASE_URL}/newest/page/${page}.json`
  }
  if (tab === 'active') {
    return `${LOBSTERS_BASE_URL}/active/page/${page}.json`
  }
  return `${LOBSTERS_BASE_URL}/page/${page}.json`
}

async function fetchFeedStories(tab: Exclude<TabValue, 'search'>, page: number): Promise<LobstersStory[]> {
  const response = await fetch(feedUrlFor(tab, page), {
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    throw new Error(`Failed to load ${tab} feed page ${page}`)
  }

  return (await response.json()) as LobstersStory[]
}

async function fetchSearchStories(query: string, page: number): Promise<LobstersStory[]> {
  const params = new URLSearchParams({
    what: 'stories',
    order: 'newest',
    q: query,
    page: String(page),
  })

  const response = await fetch(`${LOBSTERS_BASE_URL}/search?${params.toString()}`, {
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    throw new Error(`Failed to load search page ${page}`)
  }

  return parseSearchHtml(await response.text())
}

async function fetchStoriesForAppPage(tab: TabValue, page: number, searchQuery: string | null): Promise<PagedStories> {
  const startIndex = (page - 1) * APP_PAGE_SIZE
  const sourcePage = Math.floor(startIndex / SOURCE_PAGE_SIZE) + 1
  const offsetWithinSource = startIndex % SOURCE_PAGE_SIZE

  const loadSourcePage = tab === 'search'
    ? async (sourcePageNumber: number) => fetchSearchStories(searchQuery ?? '', sourcePageNumber)
    : async (sourcePageNumber: number) => fetchFeedStories(tab, sourcePageNumber)

  const firstSourcePage = await loadSourcePage(sourcePage)
  let combinedStories = firstSourcePage.slice(offsetWithinSource)

  if (combinedStories.length < APP_PAGE_SIZE + 1) {
    const secondSourcePage = await loadSourcePage(sourcePage + 1)
    combinedStories = [...combinedStories, ...secondSourcePage]
  }

  return {
    stories: combinedStories.slice(0, APP_PAGE_SIZE),
    hasNextPage: combinedStories.length > APP_PAGE_SIZE,
  }
}

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const searchQuery = normalizeQuery(params.q)
  const activeTab = normalizeTab(params.tab, searchQuery)
  const currentPage = normalizePage(params.page)

  let stories: LobstersStory[] = []
  let hasNextPage = false
  let feedError: string | null = null

  try {
    const pagedStories = await fetchStoriesForAppPage(activeTab, currentPage, searchQuery)
    stories = pagedStories.stories
    hasNextPage = pagedStories.hasNextPage
  } catch {
    feedError = 'Unable to load the selected feed right now. Please try again shortly.'
  }

  const isFirstPage = currentPage === 1
  const hasSearchTab = Boolean(searchQuery)

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
        <form action="/" method="get" className="mb-4 flex flex-wrap items-center gap-2">
          <input type="hidden" name="tab" value="search" />
          <input type="hidden" name="page" value="1" />
          <input
            type="search"
            name="q"
            defaultValue={searchQuery ?? ''}
            placeholder="Search Lobsters stories"
            enterKeyHint="search"
            className="h-10 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Search Lobsters stories"
            required
          />
          <button
            type="submit"
            className="h-10 rounded-md border border-border px-4 text-sm font-medium transition hover:bg-accentSoft"
          >
            Search
          </button>
        </form>

        <div className="mb-4 border-b border-border">
          <div className="flex items-center gap-2" role="tablist" aria-label="Feed tabs">
            <Link
              href={queryFor('hottest', 1)}
              role="tab"
              aria-selected={activeTab === 'hottest'}
              className={`-mb-px inline-flex rounded-t-md border px-3 py-2 text-sm font-medium ${
                activeTab === 'hottest'
                  ? 'border-border border-b-surface bg-surface text-text'
                  : 'border-transparent text-muted hover:text-text'
              }`}
            >
              🔥 Hottest
            </Link>
            <Link
              href={queryFor('newest', 1)}
              role="tab"
              aria-selected={activeTab === 'newest'}
              className={`-mb-px inline-flex rounded-t-md border px-3 py-2 text-sm font-medium ${
                activeTab === 'newest'
                  ? 'border-border border-b-surface bg-surface text-text'
                  : 'border-transparent text-muted hover:text-text'
              }`}
            >
              🆕 Newest
            </Link>
            <Link
              href={queryFor('active', 1)}
              role="tab"
              aria-selected={activeTab === 'active'}
              className={`-mb-px inline-flex rounded-t-md border px-3 py-2 text-sm font-medium ${
                activeTab === 'active'
                  ? 'border-border border-b-surface bg-surface text-text'
                  : 'border-transparent text-muted hover:text-text'
              }`}
            >
              ⚡ Active
            </Link>
            {hasSearchTab ? (
              <Link
                href={queryFor('search', 1, searchQuery)}
                role="tab"
                aria-selected={activeTab === 'search'}
                className={`-mb-px inline-flex rounded-t-md border px-3 py-2 text-sm font-medium ${
                  activeTab === 'search'
                    ? 'border-border border-b-surface bg-surface text-text'
                    : 'border-transparent text-muted hover:text-text'
                }`}
              >
                🔍 Search
              </Link>
            ) : null}
          </div>
        </div>

        <PaginationControls
          tab={activeTab}
          currentPage={currentPage}
          isFirstPage={isFirstPage}
          hasNextPage={hasNextPage}
          searchQuery={searchQuery ?? undefined}
          className="mb-5 border-b border-border pb-4"
        />

        {activeTab === 'search' && searchQuery ? (
          <p className="mb-4 text-sm text-muted">
            Results for <span className="font-medium text-text">"{searchQuery}"</span>
          </p>
        ) : null}

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

                    {story.comments_url ? (
                      <Link
                        href={story.comments_url}
                        className="w-fit text-xs text-accent underline-offset-2 hover:underline"
                      >
                        View discussion
                      </Link>
                    ) : null}
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
          searchQuery={searchQuery ?? undefined}
          className="mt-5 border-t border-border pt-4"
        />
      </section>
    </main>
  )
}
