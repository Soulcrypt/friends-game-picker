import { NextRequest, NextResponse } from 'next/server'
import { searchIGDB, igdbToUnifiedResult } from '@/lib/services/igdb'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || searchParams.get('term')
  const limit = parseInt(searchParams.get('limit') || '10', 10)

  if (!query) {
    return NextResponse.json({ error: 'Missing search query' }, { status: 400 })
  }

  // Check if IGDB credentials are configured
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'IGDB not configured', items: [] },
      { status: 503 }
    )
  }

  try {
    const games = await searchIGDB(query, limit)
    const results = games.map(igdbToUnifiedResult)

    return NextResponse.json({
      items: results,
      count: results.length,
    })
  } catch (error) {
    console.error('IGDB search error:', error)
    return NextResponse.json(
      { error: 'Failed to search IGDB', items: [] },
      { status: 500 }
    )
  }
}

// Cache for 5 minutes
export const revalidate = 300
