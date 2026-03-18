'use client'

import { useState, useEffect, useCallback } from 'react'
import { getReactions, getUserReactions, toggleReaction, getSessionId } from '../votes'
import type { ReactionType, ReactionCounts } from '../types'

interface UseReactionsResult {
  counts: ReactionCounts
  userReactions: ReactionType[]
  handleToggle: (type: ReactionType) => void
  loading: boolean
}

export function useReactions(gameId: string): UseReactionsResult {
  const [counts, setCounts] = useState<ReactionCounts>({ played: 0, own: 0, try: 0 })
  const [userReactions, setUserReactions] = useState<ReactionType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const sessionId = getSessionId()

    async function load() {
      const [gameCounts, userReacts] = await Promise.all([
        getReactions(gameId),
        sessionId ? getUserReactions(gameId, sessionId) : Promise.resolve([]),
      ])

      if (!cancelled) {
        setCounts(gameCounts)
        setUserReactions(userReacts)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [gameId])

  const handleToggle = useCallback((type: ReactionType) => {
    const sessionId = getSessionId()
    if (!sessionId) return

    // Optimistic update
    const wasActive = userReactions.includes(type)
    setUserReactions(prev =>
      wasActive ? prev.filter(r => r !== type) : [...prev, type]
    )
    setCounts(prev => ({
      ...prev,
      [type]: wasActive ? Math.max(0, prev[type] - 1) : prev[type] + 1,
    }))

    // Persist
    toggleReaction(gameId, sessionId, type).then(({ counts: newCounts }) => {
      setCounts(newCounts)
    }).catch(() => {
      // Revert on error
      setUserReactions(prev =>
        wasActive ? [...prev, type] : prev.filter(r => r !== type)
      )
      setCounts(prev => ({
        ...prev,
        [type]: wasActive ? prev[type] + 1 : Math.max(0, prev[type] - 1),
      }))
    })
  }, [gameId, userReactions])

  return { counts, userReactions, handleToggle, loading }
}
