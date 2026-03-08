import Link from 'next/link'
import { HomeChrome } from '@/components/home-chrome'
import { PaginationControls } from '@/components/pagination-controls'
import { StoryList } from '@/components/story-list'
import { fetchDiscussion, type DiscussionPayload } from '@/lib/discussions'
import {
  fetchHomeStories,
  attachAuthorAvatars,
  type FrontPageTab,
  type LobstersStory,
} from '@/lib/story-feed'

const DEFAULT_TAB = 'hottest'

type TabValue = FrontPageTab

type SearchParams = {
  tab?: string
  page?: string
  q?: string
  discussion?: string
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

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const searchQuery = normalizeQuery(params.q)
  const activeTab = normalizeTab(params.tab, searchQuery)
  const currentPage = normalizePage(params.page)
  const selectedDiscussionId = normalizeQuery(params.discussion)

  let stories: LobstersStory[] = []
  let hasNextPage = false
  let feedError: string | null = null
  let initialDiscussion: DiscussionPayload | null = null

  try {
    const pagedStories = await fetchHomeStories(activeTab, currentPage, searchQuery)
    stories = await attachAuthorAvatars(pagedStories.stories)
    hasNextPage = pagedStories.hasNextPage
  } catch {
    feedError = 'Unable to load the selected feed right now. Please try again shortly.'
  }

  if (
    !feedError &&
    selectedDiscussionId &&
    stories.some((story) => story.short_id === selectedDiscussionId)
  ) {
    try {
      initialDiscussion = await fetchDiscussion(selectedDiscussionId)
    } catch {
      initialDiscussion = null
    }
  }

  const isFirstPage = currentPage === 1
  const hasSearchTab = Boolean(searchQuery)

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-14 pt-5 sm:px-6 sm:pt-8">
      <HomeChrome>
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-6">
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
            <StoryList stories={stories} initialDiscussion={initialDiscussion} />
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
      </HomeChrome>
    </main>
  )
}
