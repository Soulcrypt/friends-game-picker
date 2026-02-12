import { GameSource, UnifiedSearchResult, ExternalIds, Game } from '../types'
import { searchIGDB, igdbToUnifiedResult, getIGDBDetails, getTrailerUrl, getScreenshots } from './igdb'

// Steam search result type (from the existing API)
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
 * Search Steam API for games
 */
async function searchSteam(query: string): Promise<UnifiedSearchResult[]> {
  try {
    const response = await fetch(
      `/api/steam/search?term=${encodeURIComponent(query)}`
    )

    if (!response.ok) {
      console.error('Steam search failed:', response.statusText)
      return []
    }

    const data = await response.json()
    const items: SteamSearchItem[] = data.items || []

    return items.map((item) => ({
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
 * Search IGDB API for games (server-side)
 */
async function searchIGDBServer(query: string): Promise<UnifiedSearchResult[]> {
  try {
    const games = await searchIGDB(query, 10)
    return games.map(igdbToUnifiedResult)
  } catch (error) {
    console.error('IGDB search error:', error)
    return []
  }
}

/**
 * Deduplicate search results by matching external IDs
 * Priority: IGDB > Steam (since IGDB has more metadata)
 */
function deduplicateResults(results: UnifiedSearchResult[]): UnifiedSearchResult[] {
  const seen = new Map<string, UnifiedSearchResult>()
  const steamAppIdMap = new Map<number, UnifiedSearchResult>()

  for (const result of results) {
    // If this result has a Steam App ID, check for duplicates
    if (result.externalIds.steam_appid) {
      const existing = steamAppIdMap.get(result.externalIds.steam_appid)
      if (existing) {
        // Merge: prefer IGDB data but keep Steam-specific info
        if (result.source === 'igdb') {
          // IGDB result found matching Steam, merge and prefer IGDB
          const merged = mergeResults(result, existing)
          seen.set(result.id, merged)
          steamAppIdMap.set(result.externalIds.steam_appid, merged)
          // Remove the old Steam entry
          seen.delete(existing.id)
        } else {
          // Steam result found but IGDB already exists, skip
          continue
        }
      } else {
        steamAppIdMap.set(result.externalIds.steam_appid, result)
        seen.set(result.id, result)
      }
    } else {
      // No Steam App ID, just add to seen
      seen.set(result.id, result)
    }
  }

  return Array.from(seen.values())
}

/**
 * Merge two search results, preferring the primary source
 */
function mergeResults(
  primary: UnifiedSearchResult,
  secondary: UnifiedSearchResult
): UnifiedSearchResult {
  return {
    ...primary,
    externalIds: {
      ...secondary.externalIds,
      ...primary.externalIds,
    },
    // Use secondary's price if primary doesn't have one (Steam usually has better price data)
    price: primary.price || secondary.price,
    metacritic: primary.metacritic || secondary.metacritic,
  }
}

/**
 * Rank search results by relevance
 */
function rankResults(results: UnifiedSearchResult[], query: string): UnifiedSearchResult[] {
  const queryLower = query.toLowerCase()

  return results.sort((a, b) => {
    const aTitle = a.title.toLowerCase()
    const bTitle = b.title.toLowerCase()

    // Exact match gets highest priority
    if (aTitle === queryLower && bTitle !== queryLower) return -1
    if (bTitle === queryLower && aTitle !== queryLower) return 1

    // Starts with query gets second priority
    if (aTitle.startsWith(queryLower) && !bTitle.startsWith(queryLower)) return -1
    if (bTitle.startsWith(queryLower) && !aTitle.startsWith(queryLower)) return 1

    // Contains query gets third priority
    if (aTitle.includes(queryLower) && !bTitle.includes(queryLower)) return -1
    if (bTitle.includes(queryLower) && !aTitle.includes(queryLower)) return 1

    // Metacritic score as tiebreaker
    const aScore = a.metacritic || 0
    const bScore = b.metacritic || 0
    return bScore - aScore
  })
}

/**
 * GameAggregator class for multi-source game search
 */
export class GameAggregator {
  /**
   * Search across all configured sources
   */
  async searchAll(
    query: string,
    sources?: GameSource[]
  ): Promise<UnifiedSearchResult[]> {
    const activeSources = sources || ['steam', 'igdb']
    const searchPromises: Promise<UnifiedSearchResult[]>[] = []

    if (activeSources.includes('steam')) {
      searchPromises.push(searchSteam(query))
    }

    if (activeSources.includes('igdb')) {
      searchPromises.push(searchIGDBServer(query))
    }

    const resultsArrays = await Promise.all(searchPromises)
    const allResults = resultsArrays.flat()

    // Deduplicate and rank
    const deduplicated = deduplicateResults(allResults)
    return rankResults(deduplicated, query)
  }

  /**
   * Get full game details from external IDs
   */
  async getDetails(externalIds: ExternalIds): Promise<Partial<Game> | null> {
    // Prefer IGDB for full details
    if (externalIds.igdb_id) {
      try {
        const game = await getIGDBDetails(externalIds.igdb_id)
        if (game) {
          const unified = igdbToUnifiedResult(game)
          return {
            title: unified.title,
            cover: unified.cover,
            tags: unified.genres || [],
            metacritic: unified.metacritic,
            release_date: unified.releaseDate,
            platforms: unified.platforms,
            description: unified.description,
            trailer_url: getTrailerUrl(game),
            screenshots: getScreenshots(game),
            igdb_id: game.id,
            steam_appid: externalIds.steam_appid,
            epic_id: externalIds.epic_id,
            xbox_id: externalIds.xbox_id,
            gog_id: externalIds.gog_id,
            primary_source: 'igdb',
          }
        }
      } catch (error) {
        console.error('IGDB details fetch error:', error)
      }
    }

    // Fallback to Steam if available
    if (externalIds.steam_appid) {
      try {
        const response = await fetch(
          `/api/steam/details?appid=${externalIds.steam_appid}`
        )
        if (response.ok) {
          const data = await response.json()
          if (data && data.success) {
            const details = data.data
            return {
              title: details.name,
              cover: details.header_image,
              tags: details.genres?.map((g: { description: string }) => g.description) || [],
              metacritic: details.metacritic?.score,
              price: details.is_free
                ? 'Free'
                : details.price_overview?.final_formatted || 'TBD',
              description: details.short_description,
              steam_appid: externalIds.steam_appid,
              primary_source: 'steam',
            }
          }
        }
      } catch (error) {
        console.error('Steam details fetch error:', error)
      }
    }

    return null
  }

  /**
   * Enrich an existing game with data from additional sources
   */
  async enrichGame(game: Game): Promise<Game> {
    // If game already has IGDB ID, try to fetch more data
    if (!game.igdb_id && game.title) {
      try {
        const results = await searchIGDB(game.title, 1)
        if (results.length > 0) {
          const igdbGame = results[0]
          const unified = igdbToUnifiedResult(igdbGame)

          // Only update if it's a close match
          if (
            unified.title.toLowerCase() === game.title.toLowerCase() ||
            unified.externalIds.steam_appid === game.steam_appid
          ) {
            return {
              ...game,
              igdb_id: igdbGame.id,
              description: game.description || unified.description,
              screenshots: game.screenshots?.length
                ? game.screenshots
                : getScreenshots(igdbGame),
              trailer_url: game.trailer_url || getTrailerUrl(igdbGame),
              epic_id: unified.externalIds.epic_id,
              xbox_id: unified.externalIds.xbox_id,
              gog_id: unified.externalIds.gog_id,
            }
          }
        }
      } catch (error) {
        console.error('Game enrichment error:', error)
      }
    }

    return game
  }
}

// Export a singleton instance
export const gameAggregator = new GameAggregator()
