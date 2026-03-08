'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import type { DiscussionComment, DiscussionPayload } from '@/lib/discussions'
import { formatPostedAt, lobstersUserUrl } from '@/lib/lobsters'

type DiscussionDrawerProps = {
  shortId: string
  storyTitle: string
  storyPermalink: string
  commentCount: number
  commentsUrl: string
  initialDiscussion?: DiscussionPayload | null
}

function CommentThread({ comment }: { comment: DiscussionComment }) {
  const postedAt = formatPostedAt(comment.created_at)
  const authorUrl = lobstersUserUrl(comment.commenting_user)

  return (
    <li className="space-y-3">
      <article className="rounded-2xl border border-border bg-surface p-4 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              <span>{comment.commenting_user}</span>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-6 w-6 rounded-full p-0 text-muted"
              >
                <a
                  href={authorUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${comment.commenting_user} on Lobsters`}
                  title="Open author on Lobsters"
                >
                  <span aria-hidden className="text-xs leading-none">
                    🦞
                  </span>
                </a>
              </Button>
              {comment.score !== null ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{comment.score} points</span>
                </>
              ) : null}
              {postedAt ? (
                <>
                  <span aria-hidden>·</span>
                  <time dateTime={postedAt.iso} title={postedAt.absolute}>
                    {postedAt.absolute}
                  </time>
                  <span>({postedAt.relative})</span>
                </>
              ) : null}
            </p>
          </div>

          <Button asChild variant="ghost" size="sm" className="h-8 w-8 shrink-0 rounded-full p-0">
            <a
              href={comment.url}
              target="_blank"
              rel="noreferrer"
              aria-label="Open comment on Lobsters"
              title="Open comment on Lobsters"
            >
              <span aria-hidden className="text-sm leading-none">
                🦞
              </span>
            </a>
          </Button>
        </div>

        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-text">
          {comment.comment_plain || 'No plain-text body available for this comment.'}
        </p>
      </article>

      {comment.comments.length > 0 ? (
        <ul className="space-y-3 border-l border-border/70 pl-4 sm:pl-5">
          {comment.comments.map((child) => (
            <CommentThread key={child.short_id} comment={child} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export function DiscussionDrawer({
  shortId,
  storyTitle,
  storyPermalink,
  commentCount,
  commentsUrl,
  initialDiscussion = null,
}: DiscussionDrawerProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isOpenFromUrl = searchParams.get('discussion') === shortId
  const [open, setOpen] = useState(isOpenFromUrl)
  const [discussion, setDiscussion] = useState<DiscussionPayload | null>(initialDiscussion)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setOpen(isOpenFromUrl)
  }, [isOpenFromUrl])

  useEffect(() => {
    if (initialDiscussion?.short_id === shortId) {
      setDiscussion(initialDiscussion)
      setError(null)
    }
  }, [initialDiscussion, shortId])

  useEffect(() => {
    if (!open || discussion) {
      return
    }

    let cancelled = false

    async function loadDiscussion() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/discussions/${shortId}`, {
          method: 'GET',
          cache: 'force-cache',
        })

        if (!response.ok) {
          throw new Error('Failed to load discussion')
        }

        const payload = (await response.json()) as DiscussionPayload
        if (!cancelled) {
          setDiscussion(payload)
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load this discussion right now.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadDiscussion()

    return () => {
      cancelled = true
    }
  }, [discussion, open, shortId])

  const renderedDiscussion = discussion ?? {
    short_id: shortId,
    title: storyTitle,
    comment_count: commentCount,
    created_at: null,
    comments_url: commentsUrl,
    comments: [],
  }
  const storyPostedAt = formatPostedAt(renderedDiscussion.created_at)
  const isDiscussionDisabled = commentCount === 0

  function updateDiscussionParam(nextOpen: boolean) {
    const params = new URLSearchParams(searchParams.toString())

    if (nextOpen) {
      params.set('discussion', shortId)
    } else {
      params.delete('discussion')
    }

    const nextQuery = params.toString()
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname
    window.history.replaceState(window.history.state, '', nextUrl)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isDiscussionDisabled && nextOpen) {
      return
    }

    setOpen(nextOpen)
    updateDiscussionParam(nextOpen)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        disabled={isDiscussionDisabled}
        className="w-fit text-left text-xs text-accent underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
      >
        View discussion
      </button>

      <SheetContent
        side="bottom"
        className="px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-10 sm:px-6"
      >
        <div className="mx-auto w-full max-w-3xl">
          <SheetHeader className="pr-10">
            <div className="flex items-start gap-3">
              <SheetTitle className="min-w-0 flex-1 text-xl sm:text-2xl">
                {renderedDiscussion.title}
              </SheetTitle>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 rounded-full p-0"
              >
                <a
                  href={storyPermalink}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${renderedDiscussion.title} on Lobsters`}
                  title="Open story on Lobsters"
                >
                  <span aria-hidden className="text-sm leading-none">
                    🦞
                  </span>
                </a>
              </Button>
            </div>
            <SheetDescription>
              {renderedDiscussion.comment_count} comments
              {storyPostedAt ? ` · ${storyPostedAt.absolute} (${storyPostedAt.relative})` : ''}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {loading ? (
              <p className="text-sm text-muted">Loading discussion…</p>
            ) : error ? (
              <div className="space-y-3 rounded-2xl border border-border bg-accentSoft p-4">
                <p className="text-sm text-text">{error}</p>
                <Link
                  href={commentsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-accent underline-offset-2 hover:underline"
                >
                  Open on Lobsters
                </Link>
              </div>
            ) : renderedDiscussion.comments.length === 0 ? (
              <p className="text-sm text-muted">No comments in this discussion yet.</p>
            ) : (
              <ul className="space-y-4">
                {renderedDiscussion.comments.map((comment) => (
                  <CommentThread key={comment.short_id} comment={comment} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
