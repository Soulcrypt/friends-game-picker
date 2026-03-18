import { v4 as uuidv4 } from 'uuid'
import { supabase, createSupabaseBrowserClient } from './supabase'
import type { Game, ReactionType, ReactionCounts, Poll, RankedVote, Profile, GameResult, VoterInfo } from './types'

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
    console.error('Error fetching games:', error.message, error.code, error.details, error.hint)
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
    console.error('Error fetching user votes:', error.message, error.code, error.details, error.hint)
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

  const { data, error } = await supabase
    .from('games')
    .insert(newGame)
    .select()
    .single()

  if (error) {
    console.error('[addGame] Insert error:', error.message, error.details, error.hint)
    return null
  }

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

// =====================================================
// POLL FUNCTIONS
// =====================================================

export async function getPolls(): Promise<Poll[]> {
  const { data, error } = await supabase
    .from('polls')
    .select(`
      *,
      creator:profiles!polls_created_by_fkey(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching polls:', error)
    return []
  }

  return data || []
}

export async function getActivePoll(): Promise<Poll | null> {
  const { data, error } = await supabase
    .from('polls')
    .select(`
      *,
      creator:profiles!polls_created_by_fkey(*)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching active poll:', error)
    return null
  }

  return data
}

export async function getPoll(pollId: string): Promise<Poll | null> {
  const { data, error } = await supabase
    .from('polls')
    .select(`
      *,
      creator:profiles!polls_created_by_fkey(*)
    `)
    .eq('id', pollId)
    .single()

  if (error) {
    console.error('Error fetching poll:', error)
    return null
  }

  return data
}

export async function createPoll(
  title: string,
  userId: string,
  endsAt?: Date,
  maxRanks: number = 3
): Promise<Poll | null> {
  const client = createSupabaseBrowserClient()

  const { data, error } = await client
    .from('polls')
    .insert({
      title,
      created_by: userId,
      ends_at: endsAt?.toISOString() || null,
      max_ranks: maxRanks,
      status: 'active',
    })
    .select(`
      *,
      creator:profiles!polls_created_by_fkey(*)
    `)
    .single()

  if (error) {
    console.error('Error creating poll:', error)
    return null
  }

  return data
}

export async function endPoll(pollId: string): Promise<boolean> {
  const client = createSupabaseBrowserClient()

  const { error } = await client
    .from('polls')
    .update({ status: 'ended' })
    .eq('id', pollId)

  if (error) {
    console.error('Error ending poll:', error)
    return false
  }

  return true
}

// =====================================================
// RANKED VOTING FUNCTIONS
// =====================================================

export async function getRankedVotes(pollId: string): Promise<RankedVote[]> {
  const { data, error } = await supabase
    .from('ranked_votes')
    .select(`
      *,
      voter:profiles!ranked_votes_user_id_fkey(*),
      game:games!ranked_votes_game_id_fkey(*)
    `)
    .eq('poll_id', pollId)

  if (error) {
    console.error('Error fetching ranked votes:', error)
    return []
  }

  return data || []
}

export async function getUserRankedVotes(
  pollId: string,
  userId: string
): Promise<RankedVote[]> {
  const { data, error } = await supabase
    .from('ranked_votes')
    .select('*')
    .eq('poll_id', pollId)
    .eq('user_id', userId)
    .order('rank', { ascending: true })

  if (error) {
    console.error('Error fetching user ranked votes:', error)
    return []
  }

  return data || []
}

export async function submitRankedVotes(
  pollId: string,
  userId: string,
  rankings: { gameId: string; rank: number }[]
): Promise<boolean> {
  const client = createSupabaseBrowserClient()

  // First, delete existing votes for this user in this poll
  const { error: deleteError } = await client
    .from('ranked_votes')
    .delete()
    .eq('poll_id', pollId)
    .eq('user_id', userId)

  if (deleteError) {
    console.error('Error deleting existing votes:', deleteError)
    return false
  }

  // If no rankings, we're done (user cleared their votes)
  if (rankings.length === 0) {
    return true
  }

  // Insert new votes
  const votes = rankings.map(r => ({
    poll_id: pollId,
    user_id: userId,
    game_id: r.gameId,
    rank: r.rank,
  }))

  const { error: insertError } = await client
    .from('ranked_votes')
    .insert(votes)

  if (insertError) {
    console.error('Error inserting ranked votes:', insertError)
    return false
  }

  return true
}

export async function getVotersForGame(
  pollId: string,
  gameId: string
): Promise<VoterInfo[]> {
  const { data, error } = await supabase
    .from('ranked_votes')
    .select(`
      rank,
      voter:profiles!ranked_votes_user_id_fkey(*)
    `)
    .eq('poll_id', pollId)
    .eq('game_id', gameId)
    .order('rank', { ascending: true })

  if (error) {
    console.error('Error fetching voters for game:', error)
    return []
  }

  return (data || []).map(v => ({
    profile: v.voter as unknown as Profile,
    rank: v.rank,
  }))
}

export async function calculateResults(pollId: string): Promise<GameResult[]> {
  const votes = await getRankedVotes(pollId)

  if (votes.length === 0) {
    return []
  }

  // Group votes by game and calculate points
  const gameResults: Record<string, {
    game_id: string
    game?: Game
    total_points: number
    first_choice_votes: number
    second_choice_votes: number
    third_choice_votes: number
    voters: VoterInfo[]
  }> = {}

  for (const vote of votes) {
    const gameId = vote.game_id

    if (!gameResults[gameId]) {
      gameResults[gameId] = {
        game_id: gameId,
        game: vote.game || undefined,
        total_points: 0,
        first_choice_votes: 0,
        second_choice_votes: 0,
        third_choice_votes: 0,
        voters: [],
      }
    }

    // Point calculation: 1st = 3pts, 2nd = 2pts, 3rd = 1pt
    const points = vote.rank === 1 ? 3 : vote.rank === 2 ? 2 : 1
    gameResults[gameId].total_points += points

    if (vote.rank === 1) gameResults[gameId].first_choice_votes++
    else if (vote.rank === 2) gameResults[gameId].second_choice_votes++
    else if (vote.rank === 3) gameResults[gameId].third_choice_votes++

    if (vote.voter) {
      gameResults[gameId].voters.push({
        profile: vote.voter,
        rank: vote.rank,
      })
    }
  }

  // Convert to array and sort by total points
  return Object.values(gameResults).sort((a, b) => {
    // Primary: total points
    if (b.total_points !== a.total_points) {
      return b.total_points - a.total_points
    }
    // Tiebreaker 1: first choice votes
    if (b.first_choice_votes !== a.first_choice_votes) {
      return b.first_choice_votes - a.first_choice_votes
    }
    // Tiebreaker 2: second choice votes
    return b.second_choice_votes - a.second_choice_votes
  })
}

export async function getTotalVotersForPoll(pollId: string): Promise<number> {
  const { data, error } = await supabase
    .from('ranked_votes')
    .select('user_id')
    .eq('poll_id', pollId)

  if (error) {
    console.error('Error fetching voters count:', error)
    return 0
  }

  // Count unique voters
  const uniqueVoters = new Set(data?.map(v => v.user_id) || [])
  return uniqueVoters.size
}
