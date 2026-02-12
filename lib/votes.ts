import { v4 as uuidv4 } from 'uuid'
import { supabase } from './supabase'
import type { Game, ReactionType, ReactionCounts } from './types'

const SESSION_KEY = 'game_picker_session_id'

export function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = uuidv4()
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}

export async function getGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('votes', { ascending: false })

  if (error) {
    console.error('Error fetching games:', error)
    return []
  }

  return data || []
}

export async function getUserVotes(sessionId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('votes')
    .select('game_id')
    .eq('session_id', sessionId)

  if (error) {
    console.error('Error fetching user votes:', error)
    return []
  }

  return (data || []).map(v => v.game_id)
}

export async function voteForGame(gameId: string, sessionId: string): Promise<{ votes: number; voted: boolean }> {
  const { data: existingVote } = await supabase
    .from('votes')
    .select('id')
    .eq('game_id', gameId)
    .eq('session_id', sessionId)
    .single()

  if (existingVote) {
    // Remove the vote - trigger will update count automatically
    await supabase
      .from('votes')
      .delete()
      .eq('game_id', gameId)
      .eq('session_id', sessionId)

    // Fetch updated vote count
    const { data: game } = await supabase
      .from('games')
      .select('votes')
      .eq('id', gameId)
      .single()

    return { votes: game?.votes || 0, voted: false }
  } else {
    // Add the vote - trigger will update count automatically
    await supabase
      .from('votes')
      .insert({ game_id: gameId, session_id: sessionId })

    // Fetch updated vote count
    const { data: game } = await supabase
      .from('games')
      .select('votes')
      .eq('id', gameId)
      .single()

    return { votes: game?.votes || 0, voted: true }
  }
}

export async function updateGameCover(gameId: string, cover: string, rawgId?: number, metacritic?: number, trailerUrl?: string): Promise<void> {
  const updates: Record<string, unknown> = { cover }
  if (rawgId) updates.rawg_id = rawgId
  if (metacritic) updates.metacritic = metacritic
  if (trailerUrl) updates.trailer_url = trailerUrl

  await supabase
    .from('games')
    .update(updates)
    .eq('id', gameId)
}

export async function addGame(game: Partial<Game>): Promise<Game | null> {
  const slug = game.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') || ''
  // Use igdb_id if no steam/rawg_id available
  const sourceId = game.rawg_id || game.steam_appid || game.igdb_id
  const id = game.id || (slug && sourceId ? `${slug}-${sourceId}` : slug) || uuidv4()

  console.log('[addGame] Attempting to add:', { title: game.title, id, slug, sourceId })

  // Check for duplicate by ID only
  const { data: existingById, error: checkError } = await supabase
    .from('games')
    .select('id, title')
    .eq('id', id)
    .maybeSingle()  // Use maybeSingle to avoid error when no match

  if (checkError) {
    console.error('[addGame] Error checking for duplicate:', checkError)
  }

  if (existingById) {
    console.log('[addGame] Game already exists with ID:', existingById)
    return null
  }

  const newGame: Partial<Game> = {
    id,
    title: game.title || 'Untitled',
    cover: game.cover || '',
    tags: game.tags || [],
    price: game.price || 'TBD',
    votes: 0,
    rawg_id: game.rawg_id || undefined,
    steam_appid: game.steam_appid || undefined,
    trailer_url: game.trailer_url || undefined,
    metacritic: game.metacritic || undefined,
    screenshots: game.screenshots || undefined,
    description: game.description || undefined,
    platforms: game.platforms || undefined,
    // Multi-source fields
    primary_source: game.primary_source || 'steam',
    igdb_id: game.igdb_id || undefined,
    epic_id: game.epic_id || undefined,
    xbox_id: game.xbox_id || undefined,
    gog_id: game.gog_id || undefined,
    platform_availability: game.platform_availability || undefined,
  }

  console.log('[addGame] Inserting new game:', newGame)

  const { data, error } = await supabase
    .from('games')
    .insert(newGame)
    .select()
    .single()

  if (error) {
    console.error('[addGame] Insert error:', error.message, error.details, error.hint)
    return null
  }

  console.log('[addGame] Successfully added:', data?.title)
  return data
}

export async function removeGame(gameId: string): Promise<boolean> {
  // Note: With secure RLS policies, game deletion is disabled for anonymous users.
  // Games can only be deleted via Supabase dashboard with service_role key.
  // This function will fail silently - which is the intended secure behavior.

  const { error } = await supabase
    .from('games')
    .delete()
    .eq('id', gameId)

  if (error) {
    console.error('Game deletion blocked by security policy (this is expected):', error.message)
    return false
  }

  return true
}

export async function restoreGame(game: Game): Promise<boolean> {
  const { error } = await supabase
    .from('games')
    .insert({
      id: game.id,
      title: game.title,
      cover: game.cover,
      tags: game.tags,
      price: game.price,
      votes: game.votes,
      rawg_id: game.rawg_id || null,
      trailer_url: game.trailer_url || null,
      metacritic: game.metacritic || null,
      steam_appid: game.steam_appid || null,
      screenshots: game.screenshots || null,
      description: game.description || null,
      short_description: game.short_description || null,
      platforms: game.platforms || null,
      release_date: game.release_date || null,
      developers: game.developers || null,
      publishers: game.publishers || null,
      categories: game.categories || null,
      created_at: game.created_at || new Date().toISOString(),
    })

  if (error) {
    console.error('Error restoring game:', error)
    return false
  }

  return true
}

export async function importGames(games: Partial<Game>[]): Promise<number> {
  let imported = 0

  for (const game of games) {
    if (!game.title) continue

    const slug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
    const id = slug && game.rawg_id ? `${slug}-${game.rawg_id}` : slug

    // Check if game already exists
    const { data: existing } = await supabase
      .from('games')
      .select('id')
      .eq('id', id)
      .single()

    if (existing) continue

    const newGame = {
      id,
      title: game.title,
      cover: game.cover || '',
      tags: game.tags || [],
      price: game.price || 'TBD',
      votes: 0,
      rawg_id: game.rawg_id || null,
      trailer_url: game.trailer_url || null,
      metacritic: game.metacritic || null,
    }

    const { error } = await supabase
      .from('games')
      .insert(newGame)

    if (!error) imported++
  }

  return imported
}

export async function getReactions(gameId: string): Promise<ReactionCounts> {
  const { data, error } = await supabase
    .from('reactions')
    .select('reaction_type')
    .eq('game_id', gameId)

  if (error) {
    console.error('Error fetching reactions:', error)
    return { played: 0, own: 0, try: 0 }
  }

  const counts: ReactionCounts = { played: 0, own: 0, try: 0 }
  for (const row of data || []) {
    const type = row.reaction_type as ReactionType
    if (type in counts) {
      counts[type]++
    }
  }

  return counts
}

export async function getUserReactions(gameId: string, sessionId: string): Promise<ReactionType[]> {
  const { data, error } = await supabase
    .from('reactions')
    .select('reaction_type')
    .eq('game_id', gameId)
    .eq('session_id', sessionId)

  if (error) {
    console.error('Error fetching user reactions:', error)
    return []
  }

  return (data || []).map(r => r.reaction_type as ReactionType)
}

export async function toggleReaction(
  gameId: string,
  sessionId: string,
  type: ReactionType
): Promise<{ added: boolean; counts: ReactionCounts }> {
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('game_id', gameId)
    .eq('session_id', sessionId)
    .eq('reaction_type', type)
    .single()

  if (existing) {
    await supabase
      .from('reactions')
      .delete()
      .eq('game_id', gameId)
      .eq('session_id', sessionId)
      .eq('reaction_type', type)

    const counts = await getReactions(gameId)
    return { added: false, counts }
  } else {
    await supabase
      .from('reactions')
      .insert({ game_id: gameId, session_id: sessionId, reaction_type: type })

    const counts = await getReactions(gameId)
    return { added: true, counts }
  }
}
