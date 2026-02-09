export type ReactionType = 'played' | 'own' | 'try'

export interface Reaction {
  id: string
  game_id: string
  session_id: string
  reaction_type: ReactionType
  created_at: string
}

export interface ReactionCounts {
  played: number
  own: number
  try: number
}

export interface GamePlatforms {
  windows: boolean
  mac: boolean
  linux: boolean
}

export interface Game {
  id: string
  title: string
  cover: string
  tags: string[]
  price: string
  votes: number
  rawg_id?: number
  trailer_url?: string
  metacritic?: number
  created_at?: string
  screenshots?: string[]
  description?: string
  short_description?: string
  platforms?: GamePlatforms
  release_date?: string
  developers?: string[]
  publishers?: string[]
  steam_appid?: number
  categories?: string[]  // Multiplayer info: "Co-op", "PvP", "Single-player", etc.
  pinned?: boolean
  notes?: string
}

export type ViewMode = 'grid' | 'list' | 'compact'
export type CardSize = 'small' | 'medium' | 'large'

export interface FilterPreset {
  id: string
  name: string
  filters: string[]
  sortBy: 'votes' | 'title'
}

export interface Vote {
  id: string
  game_id: string
  session_id: string
  created_at?: string
}

export interface RawgSearchResult {
  id: number
  name: string
  slug: string
  background_image: string | null
  genres: { id: number; name: string }[]
  metacritic: number | null
  released: string | null
  platforms: { platform: { id: number; name: string } }[] | null
}

export interface RawgTrailer {
  id: number
  name: string
  preview: string
  data: {
    480: string
    max: string
  }
}
