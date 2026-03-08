import { joinLobstersUrl } from '@/lib/lobsters'

const ALLOWED_TAGS = new Set([
  'a',
  'blockquote',
  'br',
  'code',
  'em',
  'li',
  'ol',
  'p',
  'pre',
  'strong',
  'ul',
])

const STRIP_CONTENT_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math']

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function sanitizeHref(value: string): string | null {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  if (trimmed.startsWith('/')) {
    return joinLobstersUrl(trimmed)
  }

  if (trimmed.startsWith('#')) {
    return trimmed
  }

  return null
}

export function sanitizeLobstersHtml(html: string | null | undefined): string | null {
  if (!html) {
    return null
  }

  let sanitized = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(new RegExp(`<(${STRIP_CONTENT_TAGS.join('|')})\\b[^>]*>[\\s\\S]*?<\\/\\1>`, 'gi'), '')

  sanitized = sanitized.replace(
    /<\s*(\/?)\s*([a-z0-9:-]+)([^>]*)>/gi,
    (_full, closing, rawName, rawAttrs) => {
      const tagName = String(rawName).toLowerCase()

      if (!ALLOWED_TAGS.has(tagName)) {
        return ''
      }

      if (closing) {
        return `</${tagName}>`
      }

      if (tagName !== 'a') {
        return `<${tagName}>`
      }

      const hrefMatch = String(rawAttrs).match(
        /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i,
      )
      const href = sanitizeHref(hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? '')

      if (!href) {
        return '<a>'
      }

      return `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer ugc">`
    },
  )

  return sanitized.trim() ? sanitized : null
}
