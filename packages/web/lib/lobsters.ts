import { format, formatDistanceToNow } from 'date-fns'

export const LOBSTERS_BASE_URL = 'https://lobste.rs'

export function joinLobstersUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl
  }

  return `${LOBSTERS_BASE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

export function lobstersUserUrl(username: string): string {
  return `${LOBSTERS_BASE_URL}/~${encodeURIComponent(username)}`
}

export function lobstersTagUrl(tag: string): string {
  return `${LOBSTERS_BASE_URL}/t/${encodeURIComponent(tag)}`
}

export function userRoutePath(username: string): string {
  return `/user/${encodeURIComponent(username)}`
}

export function tagRoutePath(tag: string): string {
  return `/tag/${encodeURIComponent(tag)}`
}

export function normalizeLobstersDatetime(value: string): Date | null {
  const normalizedValue = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalizedValue)

  return Number.isNaN(date.getTime()) ? null : date
}

export function formatPostedAt(
  value?: string | null,
): { absolute: string; relative: string; iso: string } | null {
  if (!value) {
    return null
  }

  const date = normalizeLobstersDatetime(value)
  if (!date) {
    return null
  }

  return {
    absolute: format(date, 'MMM d, yyyy h:mm a'),
    relative: formatDistanceToNow(date, { addSuffix: true }),
    iso: date.toISOString(),
  }
}
