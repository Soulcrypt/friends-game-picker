import { selectBestTrailer, selectScreenshots } from './utils/media'

export interface SteamSearchResult {
  type: string
  name: string
  id: number
  tiny_image: string
  metascore?: string
}

export interface SteamAppDetails {
  steam_appid: number
  name: string
  header_image: string
  is_free: boolean
  detailed_description?: string
  short_description?: string
  about_the_game?: string
  price_overview?: {
    final_formatted: string
  }
  metacritic?: {
    score: number
  }
  genres?: { id: string; description: string }[]
  categories?: { id: number; description: string }[]
  platforms?: {
    windows: boolean
    mac: boolean
    linux: boolean
  }
  developers?: string[]
  publishers?: string[]
  release_date?: {
    coming_soon: boolean
    date: string
  }
  movies?: {
    id: number
    name: string
    thumbnail: string
    webm?: {
      480: string
      max: string
    }
    mp4?: {
      480: string
      max: string
    }
    highlight?: boolean
  }[]
  screenshots?: {
    id: number
    path_thumbnail: string
    path_full: string
  }[]
}

export async function searchSteamGames(query: string): Promise<SteamSearchResult[]> {
  if (!query.trim()) return []

  try {
    const res = await fetch(`/api/steam/search?term=${encodeURIComponent(query)}`)
    if (!res.ok) return []

    const data = await res.json()
    return data.items || []
  } catch {
    return []
  }
}

export async function getSteamAppDetails(appid: number): Promise<SteamAppDetails | null> {
  try {
    const res = await fetch(`/api/steam/details?appid=${appid}`)
    if (!res.ok) return null

    const data = await res.json()
    return data
  } catch {
    return null
  }
}

export function getSteamHeaderUrl(appid: number): string {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`
}

export function getSteamLibraryCoverUrl(appid: number): string {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/library_600x900_2x.jpg`
}

export function getSteamTrailerUrl(movieId: number): string {
  return `https://steamcdn-a.akamaihd.net/steam/apps/${movieId}/movie_max.mp4`
}

export interface SteamGameData {
  cover: string
  steam_appid: number
  metacritic: number | null
  genres: string[]
  categories?: string[]
  trailer_url?: string
  price?: string
  screenshots?: string[]
  description?: string
  short_description?: string
  platforms?: {
    windows: boolean
    mac: boolean
    linux: boolean
  }
  developers?: string[]
  publishers?: string[]
  release_date?: string
}

export async function fetchSteamCoverByTitle(title: string): Promise<SteamGameData | null> {
  const results = await searchSteamGames(title)
  if (results.length === 0) return null

  const match = results[0]
  const details = await getSteamAppDetails(match.id)

  const trailerUrl = selectBestTrailer(details?.movies)

  let price: string | undefined
  if (details?.is_free) {
    price = 'Free'
  } else if (details?.price_overview) {
    price = details.price_overview.final_formatted
  }

  const screenshots = selectScreenshots(details?.screenshots, 8)
  const categories = details?.categories?.map(c => c.description) || []

  return {
    cover: details?.header_image || getSteamHeaderUrl(match.id),
    steam_appid: match.id,
    metacritic: details?.metacritic?.score ?? null,
    genres: details?.genres?.map(g => g.description) || [],
    categories,
    trailer_url: trailerUrl,
    price,
    screenshots,
    description: details?.about_the_game,
    short_description: details?.short_description,
    platforms: details?.platforms,
    developers: details?.developers,
    publishers: details?.publishers,
    release_date: details?.release_date?.date,
  }
}

// Fetch full game details for card flip view
export async function fetchGameDetails(steamAppId: number): Promise<SteamGameData | null> {
  const details = await getSteamAppDetails(steamAppId)
  if (!details) return null

  const trailerUrl = selectBestTrailer(details.movies)

  let price: string | undefined
  if (details.is_free) {
    price = 'Free'
  } else if (details.price_overview) {
    price = details.price_overview.final_formatted
  }

  return {
    cover: details.header_image,
    steam_appid: details.steam_appid,
    metacritic: details.metacritic?.score ?? null,
    genres: details.genres?.map(g => g.description) || [],
    categories: details.categories?.map(c => c.description) || [],
    trailer_url: trailerUrl,
    price,
    screenshots: selectScreenshots(details.screenshots),
    description: details.about_the_game,
    short_description: details.short_description,
    platforms: details.platforms,
    developers: details.developers,
    publishers: details.publishers,
    release_date: details.release_date?.date,
  }
}
