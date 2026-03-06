import { NextResponse } from 'next/server'

import { fetchDiscussion } from '@/lib/discussions'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shortId: string }> },
) {
  const { shortId } = await params
  try {
    return NextResponse.json(await fetchDiscussion(shortId))
  } catch {
    return NextResponse.json({ error: 'Failed to load discussion' }, { status: 502 })
  }
}
