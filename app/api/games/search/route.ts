import { NextRequest, NextResponse } from 'next/server'
import { GameSource, UnifiedSearchResult } from '@/lib/types'
import { searchIGDB, igdbToUnifiedResult } from '@/lib/services/igdb'

// Steam search result type
interface SteamSearchItem {
  id: number
  name: string
  tiny_image: string
  metascore?: string
  price?: {
    final: number
    discount_percent: number
  }
}

/**
 * Search Steam Store API (server-side)
 */
async function searchSteamServer(query: string): Promise<UnifiedSearchResult[]> {
  try {
    const response = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&cc=us&l=en`,
      { next: { revalidate: 300 } }
    )

    if (!response.ok) {
      console.error('Steam search failed:', response.statusText)
      return []
    }

    const data = await response.json()
    const items: SteamSearchItem[] = data.items || []

    return items.slice(0, 10).map((item) => ({
      id: `steam_${item.id}`,
      title: item.name,
      cover: item.tiny_image,
      source: 'steam' as GameSource,
      externalIds: { steam_appid: item.id },
      metacritic: item.metascore ? parseInt(item.metascore, 10) : undefined,
      price: item.price
        ? item.price.discount_percent > 0
          ? `$${(item.price.final / 100).toFixed(2)} (-${item.price.discount_percent}%)`
          : `$${(item.price.final / 100).toFixed(2)}`
        : undefined,
    }))
  } catch (error) {
    console.error('Steam search error:', error)
    return []
  }
}

/**
 * Deduplicate search results by matching Steam App IDs
 */
function deduplicateResults(results: UnifiedSearchResult[]): UnifiedSearchResult[] {
  const seen = new Map<string, UnifiedSearchResult>()
  const steamAppIdMap = new Map<number, UnifiedSearchResult>()

  for (const result of results) {
    if (result.externalIds.steam_appid) {
      const existing = steamAppIdMap.get(result.externalIds.steam_appid)
      if (existing) {
        // Prefer IGDB data but merge Steam info
        if (result.source === 'igdb') {
          const merged = {
            ...result,
            externalIds: { ...existing.externalIds, ...result.externalIds },
            price: result.price || existing.price,
          }
          seen.set(result.id, merged)
          steamAppIdMap.set(result.externalIds.steam_appid, merged)
          seen.delete(existing.id)
        }
      } else {
        steamAppIdMap.set(result.externalIds.steam_appid, result)
        seen.set(result.id, result)
      }
    } else {
      seen.set(result.id, result)
    }
  }

  return Array.from(seen.values())
}

/**
 * Rank results by relevance to query
 */
function rankResults(results: UnifiedSearchResult[], query: string): UnifiedSearchResult[] {
  const queryLower = query.toLowerCase()

  return results.sort((a, b) => {
    const aTitle = a.title.toLowerCase()
    const bTitle = b.title.toLowerCase()

    // Exact match
    if (aTitle === queryLower && bTitle !== queryLower) return -1
    if (bTitle === queryLower && aTitle !== queryLower) return 1

    // Starts with query
    if (aTitle.startsWith(queryLower) && !bTitle.startsWith(queryLower)) return -1
    if (bTitle.startsWith(queryLower) && !aTitle.startsWith(queryLower)) return 1

    // Contains query
    if (aTitle.includes(queryLower) && !bTitle.includes(queryLower)) return -1
    if (bTitle.includes(queryLower) && !aTitle.includes(queryLower)) return 1

    // Metacritic as tiebreaker
    return (b.metacritic || 0) - (a.metacritic || 0)
  })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || searchParams.get('term')
  const sourcesParam = searchParams.get('sources') // comma-separated

  if (!query) {
    return NextResponse.json({ error: 'Missing search query' }, { status: 400 })
  }

  // Parse sources filter
  let sources: GameSource[] = ['steam', 'igdb']
  if (sourcesParam) {
    sources = sourcesParam.split(',').filter((s): s is GameSource =>
      ['steam', 'igdb', 'epic', 'xbox', 'gog', 'manual'].includes(s)
    )
  }

  const searchPromises: Promise<UnifiedSearchResult[]>[] = []

  // Search Steam
  if (sources.includes('steam')) {
    searchPromises.push(searchSteamServer(query))
  }

  // Search IGDB (if configured)
  if (sources.includes('igdb') && process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
    searchPromises.push(
      searchIGDB(query, 10)
        .then((games) => games.map(igdbToUnifiedResult))
        .catch((error) => {
          console.error('IGDB search error:', error)
          return []
        })
    )
  }

  try {
    const resultsArrays = await Promise.all(searchPromises)
    const allResults = resultsArrays.flat()

    // Deduplicate and rank
    const deduplicated = deduplicateResults(allResults)
    const ranked = rankResults(deduplicated, query)

    return NextResponse.json({
      items: ranked,
      count: ranked.length,
      sources: sources.filter((s) =>
        s === 'steam' || (s === 'igdb' && process.env.TWITCH_CLIENT_ID)
      ),
    })
  } catch (error) {
    console.error('Unified search error:', error)
    return NextResponse.json(
      { error: 'Search failed', items: [] },
      { status: 500 }
    )
  }
}

// Cache for 5 minutes
export const revalidate = 300
