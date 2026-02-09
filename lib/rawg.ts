import type { RawgSearchResult, RawgTrailer } from './types'

const BASE_URL = 'https://api.rawg.io/api'
const API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY || ''

export async function searchGames(query: string): Promise<RawgSearchResult[]> {
  if (!query.trim() || !API_KEY || API_KEY === 'your_key_here') return []

  const res = await fetch(
    `${BASE_URL}/games?key=${API_KEY}&search=${encodeURIComponent(query)}&page_size=12`
  )

  if (!res.ok) return []

  const data = await res.json()
  return data.results || []
}

export async function getGameTrailers(rawgId: number): Promise<RawgTrailer[]> {
  if (!API_KEY || API_KEY === 'your_key_here') return []

  const res = await fetch(
    `${BASE_URL}/games/${rawgId}/movies?key=${API_KEY}`
  )

  if (!res.ok) return []

  const data = await res.json()
  return data.results || []
}

export async function fetchCoverByTitle(title: string): Promise<{
  cover: string
  rawg_id: number
  metacritic: number | null
  genres: string[]
} | null> {
  const results = await searchGames(title)
  if (results.length === 0) return null

  const game = results[0]
  return {
    cover: game.background_image || '',
    rawg_id: game.id,
    metacritic: game.metacritic,
    genres: game.genres.map(g => g.name),
  }
}
