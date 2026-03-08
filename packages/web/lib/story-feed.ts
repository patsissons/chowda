import { joinLobstersUrl, LOBSTERS_BASE_URL } from '@/lib/lobsters'

const APP_PAGE_SIZE = 10
const SOURCE_PAGE_SIZE = 25

export type FrontPageTab = 'hottest' | 'newest' | 'active' | 'search'

export type LobstersStory = {
  short_id: string
  title: string
  url: string
  score: number
  comment_count: number
  created_at?: string
  comments_url: string
  short_id_url?: string
  submitter_user: string
  tags?: string[]
  avatar_url?: string | null
}

export type PagedStories = {
  stories: LobstersStory[]
  hasNextPage: boolean
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

export function parseStoryListHtml(html: string): LobstersStory[] {
  const blocks = html.split('<li id="story_').slice(1)
  const results: LobstersStory[] = []

  for (const block of blocks) {
    const end = block.indexOf('</li>')
    if (end === -1) {
      continue
    }

    const item = block.slice(0, end)
    const shortIdMatch = item.match(/data-shortid="([^"]+)"/)
    const linkMatch = item.match(
      /<span[^>]*class="link[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/,
    )
    const submitterMatch = item.match(/<a class="u-author[^>]*>([^<]+)<\/a>/)
    const timeMatch = item.match(/<time[^>]*datetime="([^"]+)"/)
    const commentsMatch = item.match(
      /<span class="comments_label">[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?(?:(\d+)|no)\s+comments?/,
    )
    const scoreMatch = item.match(/<a class="upvoter"[^>]*>(\d+|~)<\/a>/)
    const tagMatches = [...item.matchAll(/<a class="tag[^>]*>([^<]+)<\/a>/g)]
    const avatarMatch = item.match(/<img[^>]*class="avatar"[^>]*src="([^"]+)"/)

    if (!shortIdMatch || !linkMatch || !submitterMatch) {
      continue
    }

    results.push({
      short_id: shortIdMatch[1],
      title: htmlToText(linkMatch[2]),
      url: joinLobstersUrl(htmlToText(linkMatch[1])),
      score: scoreMatch && scoreMatch[1] !== '~' ? Number(scoreMatch[1]) : 0,
      created_at: timeMatch ? timeMatch[1] : undefined,
      submitter_user: htmlToText(submitterMatch[1]),
      tags: tagMatches.map((match) => htmlToText(match[1])),
      avatar_url: avatarMatch ? joinLobstersUrl(htmlToText(avatarMatch[1])) : null,
      comment_count: commentsMatch?.[2] ? Number(commentsMatch[2]) : 0,
      comments_url: commentsMatch ? joinLobstersUrl(htmlToText(commentsMatch[1])) : '',
      short_id_url: `${LOBSTERS_BASE_URL}/s/${shortIdMatch[1]}`,
    })
  }

  return results
}

function feedUrlFor(tab: Exclude<FrontPageTab, 'search'>, page: number): string {
  if (tab === 'newest') {
    return `${LOBSTERS_BASE_URL}/newest/page/${page}.json`
  }
  if (tab === 'active') {
    return `${LOBSTERS_BASE_URL}/active/page/${page}.json`
  }
  return `${LOBSTERS_BASE_URL}/page/${page}.json`
}

async function fetchFeedStories(
  tab: Exclude<FrontPageTab, 'search'>,
  page: number,
): Promise<LobstersStory[]> {
  const response = await fetch(feedUrlFor(tab, page), {
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    throw new Error(`Failed to load ${tab} feed page ${page}`)
  }

  return (await response.json()) as LobstersStory[]
}

async function fetchHtmlStories(url: string, errorMessage: string): Promise<LobstersStory[]> {
  const response = await fetch(url, {
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    throw new Error(errorMessage)
  }

  return parseStoryListHtml(await response.text())
}

async function fetchSearchStories(query: string, page: number): Promise<LobstersStory[]> {
  const params = new URLSearchParams({
    what: 'stories',
    order: 'newest',
    q: query,
    page: String(page),
  })

  return fetchHtmlStories(
    `${LOBSTERS_BASE_URL}/search?${params.toString()}`,
    `Failed to load search page ${page}`,
  )
}

async function fetchUserStorySourcePage(username: string, page: number): Promise<LobstersStory[]> {
  const params = new URLSearchParams({ page: String(page) })

  return fetchHtmlStories(
    `${LOBSTERS_BASE_URL}/~${encodeURIComponent(username)}/stories?${params.toString()}`,
    `Failed to load stories for user ${username}`,
  )
}

async function fetchTagStorySourcePage(tag: string, page: number): Promise<LobstersStory[]> {
  const response = await fetch(
    `${LOBSTERS_BASE_URL}/t/${encodeURIComponent(tag)}/page/${page}.json`,
    {
      next: { revalidate: 60 },
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to load stories for tag ${tag}`)
  }

  return (await response.json()) as LobstersStory[]
}

async function fetchStoriesForAppPage(
  loadSourcePage: (sourcePageNumber: number) => Promise<LobstersStory[]>,
  page: number,
): Promise<PagedStories> {
  const startIndex = (page - 1) * APP_PAGE_SIZE
  const sourcePage = Math.floor(startIndex / SOURCE_PAGE_SIZE) + 1
  const offsetWithinSource = startIndex % SOURCE_PAGE_SIZE

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

async function fetchUserAvatarUrl(username: string): Promise<string | null> {
  const response = await fetch(`${LOBSTERS_BASE_URL}/~${encodeURIComponent(username)}.json`, {
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as { avatar_url?: string }
  return payload.avatar_url ? joinLobstersUrl(payload.avatar_url) : null
}

export async function attachAuthorAvatars(stories: LobstersStory[]): Promise<LobstersStory[]> {
  const usernames = [...new Set(stories.map((story) => story.submitter_user).filter(Boolean))]

  const avatarEntries = await Promise.all(
    usernames.map(async (username) => {
      try {
        return [username, await fetchUserAvatarUrl(username)] as const
      } catch {
        return [username, null] as const
      }
    }),
  )

  const avatarMap = new Map(avatarEntries)

  return stories.map((story) => ({
    ...story,
    avatar_url: story.avatar_url ?? avatarMap.get(story.submitter_user) ?? null,
  }))
}

export async function fetchHomeStories(
  tab: FrontPageTab,
  page: number,
  searchQuery: string | null,
): Promise<PagedStories> {
  const loadSourcePage =
    tab === 'search'
      ? async (sourcePageNumber: number) => fetchSearchStories(searchQuery ?? '', sourcePageNumber)
      : async (sourcePageNumber: number) => fetchFeedStories(tab, sourcePageNumber)

  return fetchStoriesForAppPage(loadSourcePage, page)
}

export async function fetchUserStories(username: string, page: number): Promise<PagedStories> {
  return fetchStoriesForAppPage(
    async (sourcePageNumber: number) => fetchUserStorySourcePage(username, sourcePageNumber),
    page,
  )
}

export async function fetchTagStories(tag: string, page: number): Promise<PagedStories> {
  return fetchStoriesForAppPage(
    async (sourcePageNumber: number) => fetchTagStorySourcePage(tag, sourcePageNumber),
    page,
  )
}
