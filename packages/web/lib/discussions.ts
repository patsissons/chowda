const LOBSTERS_BASE_URL = 'https://lobste.rs'

type LobstersComment = {
  short_id?: string
  score?: number
  depth?: number
  commenting_user?: string
  comment_plain?: string
  comments?: LobstersComment[]
}

type LobstersStory = {
  short_id?: string
  title?: string
  comment_count?: number
  comments_url?: string
  comments?: LobstersComment[]
}

export type DiscussionComment = {
  short_id: string
  score: number | null
  depth: number
  commenting_user: string
  comment_plain: string
  comments: DiscussionComment[]
}

export type DiscussionPayload = {
  short_id: string
  title: string
  comment_count: number
  comments_url: string
  comments: DiscussionComment[]
}

function normalizeNestedComment(comment: LobstersComment, fallbackDepth = 0): DiscussionComment {
  return {
    short_id: comment.short_id ?? `${comment.commenting_user ?? 'comment'}-${fallbackDepth}`,
    score: typeof comment.score === 'number' ? comment.score : null,
    depth: typeof comment.depth === 'number' ? comment.depth : fallbackDepth,
    commenting_user: comment.commenting_user ?? 'unknown',
    comment_plain: comment.comment_plain ?? '',
    comments: Array.isArray(comment.comments)
      ? comment.comments.map((child) =>
          normalizeNestedComment(
            child,
            typeof comment.depth === 'number' ? comment.depth + 1 : fallbackDepth + 1,
          ),
        )
      : [],
  }
}

function nestFlatComments(comments: LobstersComment[]): DiscussionComment[] {
  const roots: DiscussionComment[] = []
  const stack: DiscussionComment[] = []

  for (const comment of comments) {
    const normalized: DiscussionComment = {
      short_id: comment.short_id ?? `comment-${roots.length + stack.length}`,
      score: typeof comment.score === 'number' ? comment.score : null,
      depth: typeof comment.depth === 'number' ? comment.depth : 0,
      commenting_user: comment.commenting_user ?? 'unknown',
      comment_plain: comment.comment_plain ?? '',
      comments: [],
    }

    while (stack.length > normalized.depth) {
      stack.pop()
    }

    const parent = stack[stack.length - 1]
    if (parent) {
      parent.comments.push(normalized)
    } else {
      roots.push(normalized)
    }

    stack.push(normalized)
  }

  return roots
}

function normalizeComments(comments: LobstersComment[] | undefined): DiscussionComment[] {
  if (!Array.isArray(comments) || comments.length === 0) {
    return []
  }

  const hasNestedChildren = comments.some((comment) => Array.isArray(comment.comments) && comment.comments.length > 0)

  return hasNestedChildren ? comments.map((comment) => normalizeNestedComment(comment)) : nestFlatComments(comments)
}

export async function fetchDiscussion(shortId: string): Promise<DiscussionPayload> {
  const response = await fetch(`${LOBSTERS_BASE_URL}/s/${encodeURIComponent(shortId)}.json`, {
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    throw new Error(`Failed to load discussion ${shortId}`)
  }

  const story = (await response.json()) as LobstersStory

  return {
    short_id: story.short_id ?? shortId,
    title: story.title ?? 'Discussion',
    comment_count: story.comment_count ?? 0,
    comments_url: story.comments_url ?? `${LOBSTERS_BASE_URL}/s/${encodeURIComponent(shortId)}`,
    comments: normalizeComments(story.comments),
  }
}
