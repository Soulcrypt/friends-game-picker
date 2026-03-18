'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  getActivePoll,
  getUserRankedVotes,
  submitRankedVotes,
  calculateResults,
} from '../votes'
import { POLL_RESULTS_REFRESH_MS } from '../constants'
import type { Poll, GameResult } from '../types'

export function usePoll(userId?: string) {
  const [activePoll, setActivePoll] = useState<Poll | null>(null)
  const [userPollRankings, setUserPollRankings] = useState<{ [rank: number]: string }>({})
  const [pollResults, setPollResults] = useState<GameResult[]>([])

  // Load active poll on mount
  useEffect(() => {
    loadActivePoll()
  }, [])

  // Load user poll rankings when poll or user changes
  useEffect(() => {
    if (activePoll && userId) {
      loadUserPollRankings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePoll?.id, userId])

  // Refresh poll results periodically
  useEffect(() => {
    if (!activePoll) return

    const loadResults = async () => {
      const results = await calculateResults(activePoll.id)
      setPollResults(results)
    }

    loadResults()
    const interval = setInterval(loadResults, POLL_RESULTS_REFRESH_MS)
    return () => clearInterval(interval)
  }, [activePoll?.id])

  async function loadActivePoll() {
    try {
      const poll = await getActivePoll()
      setActivePoll(poll)
    } catch (error) {
      console.error('Error loading active poll:', error)
    }
  }

  async function loadUserPollRankings() {
    if (!activePoll || !userId) return

    try {
      const votes = await getUserRankedVotes(activePoll.id, userId)
      const rankings: { [rank: number]: string } = {}
      votes.forEach(v => {
        rankings[v.rank] = v.game_id
      })
      setUserPollRankings(rankings)
    } catch (error) {
      console.error('Error loading user poll rankings:', error)
    }
  }

  const handlePollRankSelect = useCallback(async (gameId: string, rank: number | null) => {
    if (!activePoll || !userId) {
      toast.error('Please login to vote')
      return
    }

    const newRankings: { gameId: string; rank: number }[] = []

    if (rank === null) {
      Object.entries(userPollRankings).forEach(([r, gId]) => {
        if (gId !== gameId) {
          newRankings.push({ gameId: gId, rank: parseInt(r) })
        }
      })
    } else {
      Object.entries(userPollRankings).forEach(([r, gId]) => {
        const existingRank = parseInt(r)
        if (gId !== gameId && existingRank !== rank) {
          newRankings.push({ gameId: gId, rank: existingRank })
        }
      })
      newRankings.push({ gameId, rank })
    }

    const newUserRankings: { [rank: number]: string } = {}
    newRankings.forEach(r => {
      newUserRankings[r.rank] = r.gameId
    })
    setUserPollRankings(newUserRankings)

    const success = await submitRankedVotes(activePoll.id, userId, newRankings)
    if (success) {
      toast.success(rank ? `Added as ${rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'} choice!` : 'Removed from poll')
      const results = await calculateResults(activePoll.id)
      setPollResults(results)
    } else {
      toast.error('Failed to update vote')
      loadUserPollRankings()
    }
  }, [activePoll, userId, userPollRankings])

  const getGamePollRank = useCallback((gameId: string): number | null => {
    for (const [rank, gId] of Object.entries(userPollRankings)) {
      if (gId === gameId) return parseInt(rank)
    }
    return null
  }, [userPollRankings])

  const getGamePollPoints = useCallback((gameId: string): number => {
    const result = pollResults.find(r => r.game_id === gameId)
    return result?.total_points || 0
  }, [pollResults])

  const handlePollStateChange = useCallback(() => {
    loadActivePoll()
    loadUserPollRankings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePoll?.id, userId])

  return {
    activePoll,
    userPollRankings,
    pollResults,
    handlePollRankSelect,
    getGamePollRank,
    getGamePollPoints,
    handlePollStateChange,
  }
}
