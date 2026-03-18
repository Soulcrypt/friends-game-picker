import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useFiltering } from '@/lib/hooks/useFiltering'
import { createMockGames } from '../helpers'

const defaultOptions = () => ({
  games: createMockGames(),
  pinnedGames: [] as string[],
  customOrder: [] as string[],
  groupBy: 'none' as const,
})

describe('useFiltering', () => {
  describe('search', () => {
    it('returns all games when no search term', () => {
      const { result } = renderHook(() => useFiltering(defaultOptions()))
      expect(result.current.filteredGames).toHaveLength(5)
    })

    it('filters games by search term', () => {
      const { result } = renderHook(() => useFiltering(defaultOptions()))

      act(() => {
        result.current.setSearchTerm('hell')
      })

      expect(result.current.filteredGames).toHaveLength(1)
      expect(result.current.filteredGames[0].title).toBe('Helldivers 2')
    })

    it('search is case insensitive', () => {
      const { result } = renderHook(() => useFiltering(defaultOptions()))

      act(() => {
        result.current.setSearchTerm('VALHEIM')
      })

      expect(result.current.filteredGames).toHaveLength(1)
      expect(result.current.filteredGames[0].id).toBe('valheim')
    })

    it('clearFilters resets search and filters', () => {
      const { result } = renderHook(() => useFiltering(defaultOptions()))

      act(() => {
        result.current.setSearchTerm('hello')
        result.current.toggleFilter('Co-op')
      })
      act(() => {
        result.current.clearFilters()
      })

      expect(result.current.searchTerm).toBe('')
      expect(result.current.activeFilters).toEqual([])
      expect(result.current.filteredGames).toHaveLength(5)
    })
  })

  describe('tag filters', () => {
    it('filters by tag', () => {
      const { result } = renderHook(() => useFiltering(defaultOptions()))

      act(() => {
        result.current.toggleFilter('Horror')
      })

      expect(result.current.filteredGames).toHaveLength(1)
      expect(result.current.filteredGames[0].id).toBe('lethal-company')
    })

    it('filters by Free price', () => {
      const { result } = renderHook(() => useFiltering(defaultOptions()))

      act(() => {
        result.current.toggleFilter('Free')
      })

      expect(result.current.filteredGames).toHaveLength(1)
      expect(result.current.filteredGames[0].id).toBe('deep-rock')
    })

    it('filters by Paid', () => {
      const { result } = renderHook(() => useFiltering(defaultOptions()))

      act(() => {
        result.current.toggleFilter('Paid')
      })

      // All non-free, non-TBD games
      const ids = result.current.filteredGames.map(g => g.id)
      expect(ids).not.toContain('deep-rock') // Free
      expect(result.current.filteredGames.length).toBeGreaterThan(0)
    })

    it('multiple filters are AND-ed', () => {
      const { result } = renderHook(() => useFiltering(defaultOptions()))

      act(() => {
        result.current.toggleFilter('Survival')
        result.current.toggleFilter('RPG')
      })

      // Only Valheim has both Survival and RPG
      expect(result.current.filteredGames).toHaveLength(1)
      expect(result.current.filteredGames[0].id).toBe('valheim')
    })

    it('toggling a filter off removes it', () => {
      const { result } = renderHook(() => useFiltering(defaultOptions()))

      act(() => {
        result.current.toggleFilter('Horror')
      })
      expect(result.current.filteredGames).toHaveLength(1)

      act(() => {
        result.current.toggleFilter('Horror')
      })
      expect(result.current.filteredGames).toHaveLength(5)
    })
  })

  describe('source filters', () => {
    it('filters by source', () => {
      const { result } = renderHook(() => useFiltering(defaultOptions()))

      act(() => {
        result.current.toggleSourceFilter('igdb')
      })

      // deep-rock and valheim have igdb_id
      const ids = result.current.filteredGames.map(g => g.id)
      expect(ids).toContain('deep-rock')
      expect(ids).toContain('valheim')
    })
  })

  describe('sorting', () => {
    it('sorts by votes descending by default', () => {
      const { result } = renderHook(() => useFiltering(defaultOptions()))

      const votes = result.current.filteredGames.map(g => g.votes)
      for (let i = 0; i < votes.length - 1; i++) {
        expect(votes[i]).toBeGreaterThanOrEqual(votes[i + 1])
      }
    })

    it('sorts by title A-Z', () => {
      const { result } = renderHook(() => useFiltering(defaultOptions()))

      act(() => {
        result.current.setSortBy('title')
      })

      const titles = result.current.filteredGames.map(g => g.title)
      const sorted = [...titles].sort((a, b) => a.localeCompare(b))
      expect(titles).toEqual(sorted)
    })
  })

  describe('pinned games', () => {
    it('pinned games appear first', () => {
      const opts = { ...defaultOptions(), pinnedGames: ['rust'] }
      const { result } = renderHook(() => useFiltering(opts))

      // Rust has 0 votes but should be first because it's pinned
      expect(result.current.filteredGames[0].id).toBe('rust')
    })
  })

  describe('custom order', () => {
    it('respects custom order when set', () => {
      const opts = {
        ...defaultOptions(),
        customOrder: ['rust', 'valheim', 'lethal-company', 'deep-rock', 'helldivers-2'],
      }
      const { result } = renderHook(() => useFiltering(opts))

      const ids = result.current.filteredGames.map(g => g.id)
      expect(ids).toEqual(['rust', 'valheim', 'lethal-company', 'deep-rock', 'helldivers-2'])
    })
  })

  describe('recently added games', () => {
    it('includes games created within last 7 days', () => {
      const { result } = renderHook(() => useFiltering(defaultOptions()))

      // Only helldivers-2 has created_at set to now
      expect(result.current.recentlyAddedGames.length).toBeGreaterThanOrEqual(1)
      expect(result.current.recentlyAddedGames[0].id).toBe('helldivers-2')
    })
  })

  describe('available filters', () => {
    it('includes Free and Paid as base filters', () => {
      const { result } = renderHook(() => useFiltering(defaultOptions()))

      expect(result.current.availableFilters).toContain('Free')
      expect(result.current.availableFilters).toContain('Paid')
    })

    it('includes tags from games', () => {
      const { result } = renderHook(() => useFiltering(defaultOptions()))

      expect(result.current.availableFilters).toContain('FPS')
      expect(result.current.availableFilters).toContain('Horror')
      expect(result.current.availableFilters).toContain('Survival')
      expect(result.current.availableFilters).toContain('RPG')
    })

    it('includes category-based filters', () => {
      const { result } = renderHook(() => useFiltering(defaultOptions()))

      expect(result.current.availableFilters).toContain('Multiplayer')
      expect(result.current.availableFilters).toContain('Co-op')
      expect(result.current.availableFilters).toContain('Single-player')
    })
  })

  describe('available sources', () => {
    it('includes sources from games', () => {
      const { result } = renderHook(() => useFiltering(defaultOptions()))

      expect(result.current.availableSources).toContain('steam')
      expect(result.current.availableSources).toContain('igdb')
    })
  })

  describe('grouped games', () => {
    it('returns null when groupBy is none', () => {
      const { result } = renderHook(() => useFiltering(defaultOptions()))
      expect(result.current.groupedGames).toBeNull()
    })

    it('groups by genre', () => {
      const opts = { ...defaultOptions(), groupBy: 'genre' as const }
      const { result } = renderHook(() => useFiltering(opts))

      expect(result.current.groupedGames).not.toBeNull()
      const groupNames = result.current.groupedGames!.map(([name]) => name)
      expect(groupNames).toContain('Co-op') // helldivers, deep-rock
      expect(groupNames).toContain('Horror') // lethal-company
      expect(groupNames).toContain('Survival') // valheim, rust
    })

    it('groups by price', () => {
      const opts = { ...defaultOptions(), groupBy: 'price' as const }
      const { result } = renderHook(() => useFiltering(opts))

      expect(result.current.groupedGames).not.toBeNull()
      const groupNames = result.current.groupedGames!.map(([name]) => name)
      expect(groupNames).toContain('Free to Play')
    })
  })
})
