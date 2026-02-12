export type ReactionType = 'played' | 'own' | 'try'

// Multi-source game types
export type GameSource = 'steam' | 'igdb' | 'epic' | 'xbox' | 'gog' | 'manual'

export interface ExternalIds {
  steam_appid?: number
  igdb_id?: number
  epic_id?: string
  xbox_id?: string
  gog_id?: number
}

export interface PlatformStoreInfo {
  url: string
  price?: string
  freeUntil?: string
  gamePass?: boolean
}

export interface GamePlatformAvailability {
  steam?: PlatformStoreInfo
  epic?: PlatformStoreInfo
  gog?: PlatformStoreInfo
  xbox?: PlatformStoreInfo
}

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
  // Multi-source fields
  primary_source?: GameSource
  igdb_id?: number
  epic_id?: string
  xbox_id?: string
  gog_id?: number
  platform_availability?: GamePlatformAvailability
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

// Unified search result from any source
export interface UnifiedSearchResult {
  id: string // Unique identifier for deduplication
  title: string
  cover: string
  source: GameSource
  externalIds: ExternalIds
  metacritic?: number
  releaseDate?: string
  platforms?: GamePlatforms
  genres?: string[]
  description?: string
  price?: string
  platformAvailability?: GamePlatformAvailability
}

// IGDB-specific types
export interface IGDBGame {
  id: number
  name: string
  cover?: {
    id: number
    url: string
    image_id: string
  }
  summary?: string
  first_release_date?: number
  aggregated_rating?: number
  genres?: { id: number; name: string }[]
  platforms?: { id: number; name: string; abbreviation?: string }[]
  external_games?: {
    category: number // 1=steam, 5=gog, 11=epic, etc.
    uid: string
  }[]
  websites?: {
    category: number
    url: string
  }[]
  screenshots?: {
    id: number
    url: string
    image_id: string
  }[]
  videos?: {
    video_id: string
    name: string
  }[]
}
