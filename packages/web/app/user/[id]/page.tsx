import Link from 'next/link'

import { HomeChrome } from '@/components/home-chrome'
import { PaginationControls } from '@/components/pagination-controls'
import { StoryList } from '@/components/story-list'
import { fetchDiscussion, type DiscussionPayload } from '@/lib/discussions'
import { lobstersUserUrl } from '@/lib/lobsters'
import { attachAuthorAvatars, fetchUserStories, type LobstersStory } from '@/lib/story-feed'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string; discussion?: string }>
}

function normalizeQuery(value?: string): string | null {
  const trimmed = (value ?? '').trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizePage(page?: string): number {
  const parsed = Number.parseInt(page ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export default async function UserStoriesPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const username = normalizeQuery(id)
  const currentPage = normalizePage(query.page)
  const selectedDiscussionId = normalizeQuery(query.discussion)

  let stories: LobstersStory[] = []
  let hasNextPage = false
  let feedError: string | null = null
  let initialDiscussion: DiscussionPayload | null = null

  if (!username) {
    feedError = 'A user id is required.'
  } else {
    try {
      const pagedStories = await fetchUserStories(username, currentPage)
      stories = await attachAuthorAvatars(pagedStories.stories)
      hasNextPage = pagedStories.hasNextPage
    } catch {
      feedError = 'Unable to load stories for this user right now. Please try again shortly.'
    }
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

  const pathname = username ? `/user/${encodeURIComponent(username)}` : '/user'

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-14 pt-5 sm:px-6 sm:pt-8">
      <HomeChrome>
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">User</p>
              <h2 className="text-2xl font-semibold text-text">{username ?? 'Unknown user'}</h2>
              <p className="mt-1 text-sm text-muted">Most recent stories submitted by this user.</p>
            </div>
            {username ? (
              <Link
                href={lobstersUserUrl(username)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-accentSoft"
              >
                Open on Lobsters
              </Link>
            ) : null}
          </div>

          <PaginationControls
            pathname={pathname}
            currentPage={currentPage}
            isFirstPage={currentPage === 1}
            hasNextPage={hasNextPage}
            className="mb-5 border-b border-border pb-4"
          />

          {feedError ? (
            <p className="rounded-lg border border-border bg-accentSoft p-3 text-sm text-text">
              {feedError}
            </p>
          ) : stories.length === 0 ? (
            <p className="text-sm text-muted">No stories found for this user.</p>
          ) : (
            <StoryList stories={stories} initialDiscussion={initialDiscussion} />
          )}

          <PaginationControls
            pathname={pathname}
            currentPage={currentPage}
            isFirstPage={currentPage === 1}
            hasNextPage={hasNextPage}
            className="mt-5 border-t border-border pt-4"
          />
        </section>
      </HomeChrome>
    </main>
  )
}
