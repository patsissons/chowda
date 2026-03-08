'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'

type TabValue = 'hottest' | 'newest' | 'active' | 'search'

type PaginationControlsProps = {
  tab?: TabValue
  currentPage: number
  isFirstPage: boolean
  hasNextPage: boolean
  searchQuery?: string
  pathname?: string
  className?: string
}

function hrefForPage(
  page: number,
  {
    pathname,
    tab,
    searchQuery,
  }: Pick<PaginationControlsProps, 'pathname' | 'tab' | 'searchQuery'>,
): string {
  if (pathname) {
    const params = new URLSearchParams()

    if (page > 1) {
      params.set('page', String(page))
    }

    const queryString = params.toString()
    return queryString ? `${pathname}?${queryString}` : pathname
  }

  const params = new URLSearchParams({ tab: tab ?? 'hottest', page: String(page) })
  if (tab === 'search' && searchQuery) {
    params.set('q', searchQuery)
  }
  return `?${params.toString()}`
}

export function PaginationControls({
  tab,
  currentPage,
  isFirstPage,
  hasNextPage,
  searchQuery,
  pathname,
  className,
}: PaginationControlsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [targetPage, setTargetPage] = useState<number | null>(null)

  function goToPage(page: number) {
    setTargetPage(page)
    startTransition(() => {
      router.push(hrefForPage(page, { pathname, tab, searchQuery }))
    })
  }

  return (
    <nav className={cn('flex items-center justify-between gap-3', className)} aria-label="Pagination">
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={isPending || isFirstPage}
        className="rounded-md border border-border px-3 py-2 text-sm transition enabled:hover:bg-accentSoft disabled:text-muted"
      >
        Previous
      </button>

      <p className="text-sm text-muted" aria-live="polite">
        {isPending ? `Loading page ${targetPage ?? currentPage}...` : `Page ${currentPage}`}
      </p>

      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={isPending || !hasNextPage}
        className="rounded-md border border-border px-3 py-2 text-sm transition enabled:hover:bg-accentSoft disabled:text-muted"
      >
        Next
      </button>
    </nav>
  )
}
