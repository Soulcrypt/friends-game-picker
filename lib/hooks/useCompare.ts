'use client'

import { useState, useCallback } from 'react'
import { MAX_COMPARE_GAMES } from '../constants'

export function useCompare() {
  const [compareGames, setCompareGames] = useState<string[]>([])

  const toggleCompare = useCallback((gameId: string) => {
    setCompareGames(prev => {
      if (prev.includes(gameId)) {
        return prev.filter(id => id !== gameId)
      } else if (prev.length < MAX_COMPARE_GAMES) {
        return [...prev, gameId]
      }
      return prev
    })
  }, [])

  const clearCompare = useCallback(() => {
    setCompareGames([])
  }, [])

  return { compareGames, toggleCompare, clearCompare }
}
