import Link from 'next/link'

import { DiscussionDrawer } from '@/components/discussion-drawer'
import { Button } from '@/components/ui/button'
import type { DiscussionPayload } from '@/lib/discussions'
import { formatPostedAt, lobstersUserUrl, tagRoutePath, userRoutePath, LOBSTERS_BASE_URL } from '@/lib/lobsters'
import type { LobstersStory } from '@/lib/story-feed'

type StoryListProps = {
  stories: LobstersStory[]
  initialDiscussion: DiscussionPayload | null
}

function domainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function domainRootUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    return `${parsed.protocol}//${parsed.hostname}`
  } catch {
    return null
  }
}

export function StoryList({ stories, initialDiscussion }: StoryListProps) {
  return (
    <ol className="divide-y divide-border">
      {stories.map((story) => {
        const domain = domainFromUrl(story.url)
        const domainUrl = domainRootUrl(story.url)
        const postedAt = formatPostedAt(story.created_at)
        const storyPermalink =
          story.comments_url || story.short_id_url || `${LOBSTERS_BASE_URL}/s/${story.short_id}`
        const authorProfileUrl = lobstersUserUrl(story.submitter_user)
        const authorRoute = userRoutePath(story.submitter_user)

        return (
          <li key={story.short_id} className="py-4 first:pt-1">
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex items-start gap-2">
                <a
                  href={story.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 break-words text-base font-medium text-text underline-offset-2 hover:underline"
                >
                  {story.title}
                </a>
                <Button asChild variant="ghost" size="sm" className="h-8 w-8 shrink-0 rounded-full p-0">
                  <a
                    href={storyPermalink}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${story.title} on Lobsters`}
                    title="Open story on Lobsters"
                  >
                    <span aria-hidden className="text-sm leading-none">
                      🦞
                    </span>
                  </a>
                </Button>
              </div>

              <div className="min-w-0 space-y-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Link
                    href={authorRoute}
                    className="shrink-0 rounded-full transition hover:ring-1 hover:ring-accent hover:ring-offset-1 hover:ring-offset-surface"
                  >
                    {story.avatar_url ? (
                      <img
                        src={story.avatar_url}
                        alt={`${story.submitter_user} avatar`}
                        className="h-6 w-6 rounded-full border border-border object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-accentSoft text-[9px] font-semibold text-text">
                        {story.submitter_user.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    <span>{story.score} points</span>
                    <span aria-hidden>·</span>
                    <span>{story.comment_count} comments</span>
                    <span aria-hidden>·</span>
                    <span>
                      by{' '}
                      <Link
                        href={authorRoute}
                        className="font-medium text-text underline-offset-2 hover:underline"
                      >
                        {story.submitter_user}
                      </Link>
                    </span>
                    <Button asChild variant="ghost" size="sm" className="h-6 w-6 rounded-full p-0 text-muted">
                      <a
                        href={authorProfileUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${story.submitter_user} on Lobsters`}
                        title="Open author on Lobsters"
                      >
                        <span aria-hidden className="text-xs leading-none">
                          🦞
                        </span>
                      </a>
                    </Button>
                    {postedAt ? (
                      <>
                        <span aria-hidden>·</span>
                        <time dateTime={postedAt.iso} title={postedAt.absolute}>
                          {postedAt.absolute}
                        </time>
                        <span>({postedAt.relative})</span>
                      </>
                    ) : null}
                    {domain ? (
                      <>
                        <span aria-hidden>·</span>
                        {domainUrl ? (
                          <a
                            href={domainUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="break-all underline-offset-2 hover:underline"
                          >
                            {domain}
                          </a>
                        ) : (
                          <span className="break-all">{domain}</span>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="shrink-0">
                    {story.comments_url ? (
                      <DiscussionDrawer
                        shortId={story.short_id}
                        storyTitle={story.title}
                        storyPermalink={storyPermalink}
                        commentCount={story.comment_count}
                        commentsUrl={story.comments_url}
                        initialDiscussion={
                          initialDiscussion?.short_id === story.short_id ? initialDiscussion : null
                        }
                      />
                    ) : null}
                  </div>

                  {story.tags && story.tags.length > 0 ? (
                    <div className="flex min-w-0 flex-wrap justify-end gap-2">
                      {story.tags.map((tag) => (
                        <Link
                          key={`${story.short_id}-${tag}`}
                          href={tagRoutePath(tag)}
                          className="rounded-full border border-border bg-accentSoft px-1 py-[0.5px] text-[9px] font-medium uppercase tracking-wide text-muted transition hover:border-accent hover:text-text"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
