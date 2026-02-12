import { NextRequest, NextResponse } from 'next/server'
import {
  getIGDBDetails,
  igdbToUnifiedResult,
  getTrailerUrl,
  getScreenshots,
} from '@/lib/services/igdb'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const igdbId = searchParams.get('id')

  if (!igdbId) {
    return NextResponse.json({ error: 'Missing IGDB ID' }, { status: 400 })
  }

  // Check if IGDB credentials are configured
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'IGDB not configured' },
      { status: 503 }
    )
  }

  try {
    const game = await getIGDBDetails(parseInt(igdbId, 10))

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const result = igdbToUnifiedResult(game)

    // Add extra details
    const details = {
      ...result,
      trailerUrl: getTrailerUrl(game),
      screenshots: getScreenshots(game),
    }

    return NextResponse.json(details)
  } catch (error) {
    console.error('IGDB details error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game details' },
      { status: 500 }
    )
  }
}

// Cache for 5 minutes
export const revalidate = 300
