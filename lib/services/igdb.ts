import { IGDBGame, UnifiedSearchResult, GamePlatforms, ExternalIds } from '../types'

// IGDB External Game Categories
const EXTERNAL_GAME_CATEGORIES = {
  STEAM: 1,
  GOG: 5,
  YOUTUBE: 10,
  MICROSOFT: 11,
  APPLE: 13,
  TWITCH: 14,
  ANDROID: 15,
  EPIC_GAME_STORE: 26,
  XBOX_MARKETPLACE: 36,
} as const

// IGDB Platform IDs for filtering
const PLATFORM_IDS = {
  PC_WINDOWS: 6,
  MAC: 14,
  LINUX: 3,
  XBOX_ONE: 49,
  XBOX_SERIES: 169,
  PS4: 48,
  PS5: 167,
  SWITCH: 130,
} as const

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Get a valid IGDB access token using Twitch OAuth2 client credentials flow
 */
export async function getIGDBToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token
  }

  const clientId = process.env.TWITCH_CLIENT_ID
  const clientSecret = process.env.TWITCH_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET must be set')
  }

  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: 'POST' }
  )

  if (!response.ok) {
    throw new Error(`Failed to get IGDB token: ${response.statusText}`)
  }

  const data = await response.json()

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000)
  }

  return cachedToken.token
}

/**
 * Make an authenticated request to the IGDB API
 */
async function igdbFetch(endpoint: string, body: string): Promise<Response> {
  const token = await getIGDBToken()
  const clientId = process.env.TWITCH_CLIENT_ID

  return fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': clientId!,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body,
  })
}

/**
 * Search for games on IGDB
 */
export async function searchIGDB(query: string, limit: number = 10): Promise<IGDBGame[]> {
  // IGDB search - don't filter by category to find all games including F2P titles
  const response = await igdbFetch('games', `
search "${query.replace(/"/g, '\\"')}";
fields name, cover.url, cover.image_id, summary, first_release_date,
       aggregated_rating, genres.name, platforms.name, platforms.abbreviation,
       external_games.category, external_games.uid,
       screenshots.url, screenshots.image_id, videos.video_id, videos.name;
limit ${limit};
`)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`IGDB search failed: ${error}`)
  }

  return response.json()
}

/**
 * Get game details by IGDB ID
 */
export async function getIGDBDetails(igdbId: number): Promise<IGDBGame | null> {
  const response = await igdbFetch('games', `
    fields name, cover.url, cover.image_id, summary, first_release_date,
           aggregated_rating, genres.name, platforms.name, platforms.abbreviation,
           external_games.category, external_games.uid, websites.category, websites.url,
           screenshots.url, screenshots.image_id, videos.video_id, videos.name;
    where id = ${igdbId};
  `)

  if (!response.ok) {
    throw new Error(`IGDB details fetch failed: ${response.statusText}`)
  }

  const games: IGDBGame[] = await response.json()
  return games[0] || null
}

/**
 * Get the high-resolution cover URL from IGDB
 */
export function getIGDBCoverUrl(imageId: string, size: 'cover_small' | 'cover_big' | '720p' | '1080p' = 'cover_big'): string {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`
}

/**
 * Get screenshot URL from IGDB
 */
export function getIGDBScreenshotUrl(imageId: string, size: 'screenshot_med' | 'screenshot_big' | 'screenshot_huge' | '1080p' = 'screenshot_big'): string {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`
}

/**
 * Extract external IDs from an IGDB game
 */
export function extractExternalIds(game: IGDBGame): ExternalIds {
  const externalIds: ExternalIds = {
    igdb_id: game.id,
  }

  if (game.external_games) {
    for (const ext of game.external_games) {
      switch (ext.category) {
        case EXTERNAL_GAME_CATEGORIES.STEAM:
          externalIds.steam_appid = parseInt(ext.uid, 10)
          break
        case EXTERNAL_GAME_CATEGORIES.GOG:
          externalIds.gog_id = parseInt(ext.uid, 10)
          break
        case EXTERNAL_GAME_CATEGORIES.EPIC_GAME_STORE:
          externalIds.epic_id = ext.uid
          break
        case EXTERNAL_GAME_CATEGORIES.XBOX_MARKETPLACE:
          externalIds.xbox_id = ext.uid
          break
      }
    }
  }

  return externalIds
}

/**
 * Determine platform availability from IGDB platform data
 */
export function extractPlatforms(game: IGDBGame): GamePlatforms {
  const platforms: GamePlatforms = {
    windows: false,
    mac: false,
    linux: false,
  }

  if (game.platforms) {
    for (const platform of game.platforms) {
      if (platform.name?.toLowerCase().includes('pc') ||
          platform.name?.toLowerCase().includes('windows') ||
          platform.abbreviation === 'PC') {
        platforms.windows = true
      }
      if (platform.name?.toLowerCase().includes('mac') ||
          platform.abbreviation === 'Mac') {
        platforms.mac = true
      }
      if (platform.name?.toLowerCase().includes('linux') ||
          platform.abbreviation === 'Linux') {
        platforms.linux = true
      }
    }
  }

  return platforms
}

/**
 * Convert IGDB game to unified search result format
 */
export function igdbToUnifiedResult(game: IGDBGame): UnifiedSearchResult {
  const externalIds = extractExternalIds(game)
  const platforms = extractPlatforms(game)

  // Generate a unique ID combining source and IGDB ID
  const uniqueId = `igdb_${game.id}`

  // Get cover URL
  let cover = ''
  if (game.cover?.image_id) {
    cover = getIGDBCoverUrl(game.cover.image_id, 'cover_big')
  }

  // Extract genres
  const genres = game.genres?.map(g => g.name) || []

  // Format release date
  let releaseDate: string | undefined
  if (game.first_release_date) {
    releaseDate = new Date(game.first_release_date * 1000).toISOString().split('T')[0]
  }

  return {
    id: uniqueId,
    title: game.name,
    cover,
    source: 'igdb',
    externalIds,
    metacritic: game.aggregated_rating ? Math.round(game.aggregated_rating) : undefined,
    releaseDate,
    platforms,
    genres,
    description: game.summary,
  }
}

/**
 * Get YouTube trailer URL from IGDB video data
 */
export function getTrailerUrl(game: IGDBGame): string | undefined {
  if (game.videos && game.videos.length > 0) {
    return `https://www.youtube.com/watch?v=${game.videos[0].video_id}`
  }
  return undefined
}

/**
 * Get screenshot URLs from IGDB game
 */
export function getScreenshots(game: IGDBGame): string[] {
  if (!game.screenshots) return []
  return game.screenshots.map(s => getIGDBScreenshotUrl(s.image_id, 'screenshot_big'))
}
