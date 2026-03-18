'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Game, GameSource } from '../types'
import {
  RECENTLY_ADDED_DAYS,
  RECENTLY_ADDED_LIMIT,
  PRICE_GROUP_ORDER,
} from '../constants'

interface UseFilteringOptions {
  games: Game[]
  pinnedGames: string[]
  customOrder: string[]
  groupBy: 'none' | 'genre' | 'price'
}

export function useFiltering({ games, pinnedGames, customOrder, groupBy }: UseFilteringOptions) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'votes' | 'title'>('votes')
  const [activeSourceFilters, setActiveSourceFilters] = useState<GameSource[]>([])

  // Available filters computed from games
  const availableFilters = useMemo(() => {
    const filterSet = new Set<string>()
    filterSet.add('Free')
    filterSet.add('Paid')

    games.forEach(game => {
      game.tags.forEach(tag => filterSet.add(tag))
      game.categories?.forEach(cat => {
        if (cat.includes('Multi-player') || cat === 'Multi-player') filterSet.add('Multiplayer')
        if (cat.includes('Co-op')) filterSet.add('Co-op')
        if (cat === 'Single-player') filterSet.add('Single-player')
        if (cat.includes('PvP')) filterSet.add('PvP')
      })
    })

    return Array.from(filterSet)
  }, [games])

  // Available sources computed from games
  const availableSources = useMemo(() => {
    const sourceSet = new Set<GameSource>()

    games.forEach(game => {
      if (game.primary_source) sourceSet.add(game.primary_source)
      if (game.steam_appid) sourceSet.add('steam')
      if (game.epic_id) sourceSet.add('epic')
      if (game.gog_id) sourceSet.add('gog')
      if (game.xbox_id) sourceSet.add('xbox')
      if (game.igdb_id) sourceSet.add('igdb')
    })

    return Array.from(sourceSet)
  }, [games])

  // Filtered and sorted games
  const filteredGames = useMemo(() => {
    let filtered = [...games]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(game =>
        game.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Source filters
    if (activeSourceFilters.length > 0) {
      filtered = filtered.filter(game => {
        return activeSourceFilters.some(source => {
          if (source === 'steam') return !!game.steam_appid
          if (source === 'epic') return !!game.epic_id
          if (source === 'gog') return !!game.gog_id
          if (source === 'xbox') return !!game.xbox_id
          if (source === 'igdb') return !!game.igdb_id || game.primary_source === 'igdb'
          return game.primary_source === source
        })
      })
    }

    // Tag/category filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter(game =>
        activeFilters.every(filter => {
          if (filter === 'Free') return game.price === 'Free'
          if (filter === 'Paid') return game.price !== 'Free' && game.price !== 'TBD'
          if (filter === 'Multiplayer') return game.categories?.some(c => c.includes('Multi-player'))
          if (filter === 'Co-op') return game.categories?.some(c => c.includes('Co-op'))
          if (filter === 'Single-player') return game.categories?.some(c => c === 'Single-player')
          if (filter === 'PvP') return game.categories?.some(c => c.includes('PvP'))
          return game.tags.includes(filter)
        })
      )
    }

    // Sort
    filtered.sort((a, b) => {
      // Custom order first
      if (customOrder.length > 0) {
        const aIndex = customOrder.indexOf(a.id)
        const bIndex = customOrder.indexOf(b.id)
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
      }

      // Pinned games come first
      const aPinned = pinnedGames.includes(a.id)
      const bPinned = pinnedGames.includes(b.id)
      if (aPinned && !bPinned) return -1
      if (!aPinned && bPinned) return 1

      // Then sort by selected method
      if (sortBy === 'votes') {
        return b.votes - a.votes
      } else {
        return a.title.localeCompare(b.title)
      }
    })

    return filtered
  }, [games, searchTerm, activeFilters, activeSourceFilters, sortBy, pinnedGames, customOrder])

  // Recently added games
  const recentlyAddedGames = useMemo(() => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - RECENTLY_ADDED_DAYS)

    return games
      .filter(game => {
        if (!game.created_at) return false
        return new Date(game.created_at) >= cutoffDate
      })
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      })
      .slice(0, RECENTLY_ADDED_LIMIT)
  }, [games])

  // Grouped games
  const groupedGames = useMemo(() => {
    if (groupBy === 'none') return null

    const groups: Record<string, Game[]> = {}

    filteredGames.forEach(game => {
      let key: string

      if (groupBy === 'genre') {
        key = game.tags[0] || 'Other'
      } else if (groupBy === 'price') {
        if (game.price === 'Free') {
          key = 'Free to Play'
        } else if (game.price.includes('$')) {
          const price = parseFloat(game.price.replace(/[^0-9.]/g, ''))
          if (price < 10) key = 'Under $10'
          else if (price < 30) key = '$10 - $30'
          else if (price < 60) key = '$30 - $60'
          else key = '$60+'
        } else {
          key = 'Other'
        }
      } else {
        key = 'All'
      }

      if (!groups[key]) groups[key] = []
      groups[key].push(game)
    })

    return Object.entries(groups).sort((a, b) => {
      if (groupBy === 'price') {
        return PRICE_GROUP_ORDER.indexOf(a[0] as typeof PRICE_GROUP_ORDER[number]) -
               PRICE_GROUP_ORDER.indexOf(b[0] as typeof PRICE_GROUP_ORDER[number])
      }
      return a[0].localeCompare(b[0])
    })
  }, [filteredGames, groupBy])

  const toggleFilter = useCallback((filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }, [])

  const clearFilters = useCallback(() => {
    setActiveFilters([])
    setSearchTerm('')
  }, [])

  const toggleSourceFilter = useCallback((source: GameSource) => {
    setActiveSourceFilters(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    )
  }, [])

  return {
    searchTerm,
    setSearchTerm,
    activeFilters,
    setActiveFilters,
    toggleFilter,
    clearFilters,
    sortBy,
    setSortBy,
    activeSourceFilters,
    toggleSourceFilter,
    availableFilters,
    availableSources,
    filteredGames,
    recentlyAddedGames,
    groupedGames,
  }
}
