import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface GameResult {
  game_id: string
  game?: {
    id: string
    title: string
    cover: string
    price: string
    votes: number
  }
  total_points: number
  first_choice_votes: number
  second_choice_votes: number
  third_choice_votes: number
  voters: {
    profile: {
      id: string
      discord_username: string
      avatar_url: string | null
    }
    rank: number
  }[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const pollId = params.id

  if (!pollId) {
    return NextResponse.json({ error: 'Poll ID is required' }, { status: 400 })
  }

  try {
    // Verify poll exists
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, title, status, ends_at, created_at')
      .eq('id', pollId)
      .single()

    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    // Fetch all votes with voter and game info
    const { data: votes, error: votesError } = await supabase
      .from('ranked_votes')
      .select(`
        id,
        game_id,
        user_id,
        rank,
        voter:profiles!ranked_votes_user_id_fkey(id, discord_username, avatar_url),
        game:games!ranked_votes_game_id_fkey(id, title, cover, price, votes)
      `)
      .eq('poll_id', pollId)

    if (votesError) {
      console.error('Error fetching votes:', votesError)
      return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 })
    }

    if (!votes || votes.length === 0) {
      return NextResponse.json({
        poll,
        results: [],
        totalVoters: 0,
      })
    }

    // Calculate results server-side
    const gameResults: Record<string, GameResult> = {}

    for (const vote of votes) {
      const gameId = vote.game_id

      if (!gameResults[gameId]) {
        // Supabase returns single objects for one-to-one joins
        const gameData = vote.game as unknown as GameResult['game']
        gameResults[gameId] = {
          game_id: gameId,
          game: gameData,
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
        const voterData = vote.voter as unknown as GameResult['voters'][number]['profile']
        gameResults[gameId].voters.push({
          profile: voterData,
          rank: vote.rank,
        })
      }
    }

    // Sort by total points, then first choice votes, then second choice votes
    const results = Object.values(gameResults).sort((a, b) => {
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points
      }
      if (b.first_choice_votes !== a.first_choice_votes) {
        return b.first_choice_votes - a.first_choice_votes
      }
      return b.second_choice_votes - a.second_choice_votes
    })

    // Count unique voters
    const uniqueVoters = new Set(votes.map(v => v.user_id))

    return NextResponse.json({
      poll,
      results,
      totalVoters: uniqueVoters.size,
    })
  } catch (error) {
    console.error('Error calculating poll results:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
