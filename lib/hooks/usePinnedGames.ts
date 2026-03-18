'use client'

import { useState, useEffect, useCallback } from 'react'
import { STORAGE_KEYS } from '../constants'

export function usePinnedGames() {
  const [pinnedGames, setPinnedGames] = useState<string[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.pinnedGames)
    if (saved) {
      try {
        setPinnedGames(JSON.parse(saved))
      } catch {
        // ignore
      }
    }
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.pinnedGames, JSON.stringify(pinnedGames))
  }, [pinnedGames])

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.pinnedGames && e.newValue) {
        try {
          setPinnedGames(JSON.parse(e.newValue))
        } catch {
          // ignore
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const togglePin = useCallback((gameId: string) => {
    setPinnedGames(prev =>
      prev.includes(gameId)
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    )
  }, [])

  return { pinnedGames, togglePin }
}
