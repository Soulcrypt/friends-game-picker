'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ReactNode,
} from 'react'
import toast from 'react-hot-toast'
import {
  getGames,
  voteForGame,
  getSessionId,
  getUserVotes,
  removeGame,
  restoreGame,
  updateGameCover,
  getActivePoll,
  getUserRankedVotes,
  submitRankedVotes,
  calculateResults,
} from './votes'
import { fetchSteamCoverByTitle } from './steam'
import type {
  Game,
  ViewMode,
  CardSize,
  FilterPreset,
  GameSource,
  Poll,
  GameResult,
} from './types'
import {
  STORAGE_KEYS,
  RECENTLY_ADDED_DAYS,
  RECENTLY_ADDED_LIMIT,
  LOADING_TIMEOUT_MS,
  POLL_RESULTS_REFRESH_MS,
  PRICE_GROUP_ORDER,
  MOBILE_BREAKPOINT,
} from './constants'

// =====================================================
// TYPES
// =====================================================

interface GameContextValue {
  // Game data
  games: Game[]
  filteredGames: Game[]
  recentlyAddedGames: Game[]
  groupedGames: [string, Game[]][] | null
  loading: boolean

  // Filter/sort state
  searchTerm: string
  setSearchTerm: (term: string) => void
  activeFilters: string[]
  toggleFilter: (filter: string) => void
  clearFilters: () => void
  sortBy: 'votes' | 'title'
  setSortBy: (sort: 'votes' | 'title') => void
  availableFilters: string[]

  // Source filters
  activeSourceFilters: GameSource[]
  toggleSourceFilter: (source: GameSource) => void
  availableSources: GameSource[]

  // View state
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  cardSize: CardSize
  setCardSize: (size: CardSize) => void
  groupBy: 'none' | 'genre' | 'price'
  setGroupBy: (group: 'none' | 'genre' | 'price') => void
  collapsedGroups: string[]
  toggleGroupCollapse: (groupName: string) => void

  // Pinned games
  pinnedGames: string[]
  togglePin: (gameId: string) => void

  // Voting
  votedGames: string[]
  handleVote: (gameId: string) => Promise<void>

  // Compare
  compareGames: string[]
  toggleCompare: (gameId: string) => void
  clearCompare: () => void

  // Filter presets
  filterPresets: FilterPreset[]
  saveFilterPreset: (name: string) => void
  loadFilterPreset: (preset: FilterPreset) => void
  deleteFilterPreset: (presetId: string) => void

  // Custom order (drag & drop)
  customOrder: string[]
  setCustomOrder: (order: string[]) => void

  // Game operations
  handleRemove: (gameId: string, title: string) => Promise<void>
  handleRefresh: (gameId: string) => Promise<void>
  handleRefreshAll: () => Promise<void>
  handleGameAdded: (game: Game) => void
  handleImported: () => void
  isRefreshingAll: boolean

  // Poll state
  activePoll: Poll | null
  userPollRankings: { [rank: number]: string }
  pollResults: GameResult[]
  handlePollRankSelect: (gameId: string, rank: number | null) => Promise<void>
  getGamePollRank: (gameId: string) => number | null
  getGamePollPoints: (gameId: string) => number
  handlePollStateChange: () => void

  // Mobile detection
  isMobile: boolean

  // Ref for search input
  searchInputRef: React.RefObject<HTMLInputElement>
}

const GameContext = createContext<GameContextValue | null>(null)

// =====================================================
// PROVIDER
// =====================================================

interface GameProviderProps {
  children: ReactNode
  userId?: string // From auth context
}

export function GameProvider({ children, userId }: GameProviderProps) {
  // Core state
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [votedGames, setVotedGames] = useState<string[]>([])
  const [isRefreshingAll, setIsRefreshingAll] = useState(false)

  // Filter/sort state
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'votes' | 'title'>('votes')
  const [activeSourceFilters, setActiveSourceFilters] = useState<GameSource[]>([])

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [cardSize, setCardSize] = useState<CardSize>('medium')
  const [groupBy, setGroupBy] = useState<'none' | 'genre' | 'price'>('none')
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([])

  // Pinned games
  const [pinnedGames, setPinnedGames] = useState<string[]>([])

  // Compare
  const [compareGames, setCompareGames] = useState<string[]>([])

  // Filter presets
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([])

  // Custom order
  const [customOrder, setCustomOrder] = useState<string[]>([])

  // Poll state
  const [activePoll, setActivePoll] = useState<Poll | null>(null)
  const [userPollRankings, setUserPollRankings] = useState<{ [rank: number]: string }>({})
  const [pollResults, setPollResults] = useState<GameResult[]>([])

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)

  // =====================================================
  // EFFECTS
  // =====================================================

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load games on mount
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout reached, forcing load complete')
        setLoading(false)
      }
    }, LOADING_TIMEOUT_MS)

    loadGames()
    loadUserVotes()

    return () => clearTimeout(loadingTimeout)
  }, [])

  // Load pinned games from localStorage
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

  // Save pinned games
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.pinnedGames, JSON.stringify(pinnedGames))
  }, [pinnedGames])

  // Load filter presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.filterPresets)
    if (saved) {
      try {
        setFilterPresets(JSON.parse(saved))
      } catch {
        // ignore
      }
    }
  }, [])

  // Save filter presets
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.filterPresets, JSON.stringify(filterPresets))
  }, [filterPresets])

  // Sync localStorage across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.pinnedGames && e.newValue) {
        try {
          setPinnedGames(JSON.parse(e.newValue))
        } catch {
          // ignore
        }
      }
      if (e.key === STORAGE_KEYS.filterPresets && e.newValue) {
        try {
          setFilterPresets(JSON.parse(e.newValue))
        } catch {
          // ignore
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Load active poll
  useEffect(() => {
    loadActivePoll()
  }, [])

  // Load user poll rankings when poll or user changes
  useEffect(() => {
    if (activePoll && userId) {
      loadUserPollRankings()
    }
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

  // =====================================================
  // COMPUTED VALUES
  // =====================================================

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

  // =====================================================
  // ACTIONS
  // =====================================================

  async function loadGames() {
    try {
      const data = await getGames()
      setGames(data)
      enrichCovers(data)
    } catch (error) {
      console.error('Error loading games:', error)
      toast.error('Failed to load games')
    } finally {
      setLoading(false)
    }
  }

  async function enrichCovers(loadedGames: Game[]) {
    const needsEnrich = loadedGames.filter(
      g => !g.cover || g.cover.startsWith('/covers/')
    )
    if (needsEnrich.length === 0) return

    const steamDataResults = await Promise.all(
      needsEnrich.map(game =>
        fetchSteamCoverByTitle(game.title).catch(() => null)
      )
    )

    const enrichedGames: Record<string, Partial<Game>> = {}

    for (let i = 0; i < needsEnrich.length; i++) {
      const game = needsEnrich[i]
      const steamData = steamDataResults[i]
      if (!steamData?.cover) continue

      enrichedGames[game.id] = {
        cover: steamData.cover,
        rawg_id: steamData.steam_appid,
        steam_appid: steamData.steam_appid,
        metacritic: steamData.metacritic ?? undefined,
        trailer_url: steamData.trailer_url,
        screenshots: steamData.screenshots,
        platforms: steamData.platforms,
        developers: steamData.developers,
        publishers: steamData.publishers,
        release_date: steamData.release_date,
        short_description: steamData.short_description,
        categories: steamData.categories,
      }

      updateGameCover(
        game.id,
        steamData.cover,
        steamData.steam_appid,
        steamData.metacritic ?? undefined,
        steamData.trailer_url
      )
    }

    setGames(prev =>
      prev.map(g => {
        const enriched = enrichedGames[g.id]
        if (!enriched) return g
        return { ...g, ...enriched }
      })
    )
  }

  async function loadUserVotes() {
    const sessionId = getSessionId()
    if (!sessionId) return
    const votes = await getUserVotes(sessionId)
    setVotedGames(votes)
  }

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

  const toggleGroupCollapse = useCallback((groupName: string) => {
    setCollapsedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    )
  }, [])

  const togglePin = useCallback((gameId: string) => {
    setPinnedGames(prev =>
      prev.includes(gameId)
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    )
  }, [])

  const toggleCompare = useCallback((gameId: string) => {
    setCompareGames(prev => {
      if (prev.includes(gameId)) {
        return prev.filter(id => id !== gameId)
      } else if (prev.length < 3) {
        return [...prev, gameId]
      }
      return prev
    })
  }, [])

  const clearCompare = useCallback(() => {
    setCompareGames([])
  }, [])

  const saveFilterPreset = useCallback((name: string) => {
    const preset: FilterPreset = {
      id: Date.now().toString(),
      name,
      filters: activeFilters,
      sortBy,
    }
    setFilterPresets(prev => [...prev, preset])
    toast.success(`Preset "${name}" saved!`)
  }, [activeFilters, sortBy])

  const loadFilterPreset = useCallback((preset: FilterPreset) => {
    setActiveFilters(preset.filters)
    setSortBy(preset.sortBy)
    toast.success(`Loaded "${preset.name}"`)
  }, [])

  const deleteFilterPreset = useCallback((presetId: string) => {
    setFilterPresets(prev => prev.filter(p => p.id !== presetId))
    toast.success('Preset deleted')
  }, [])

  const handleVote = useCallback(async (gameId: string) => {
    try {
      const sessionId = getSessionId()
      const result = await voteForGame(gameId, sessionId)

      setGames(prevGames =>
        prevGames.map(game =>
          game.id === gameId ? { ...game, votes: result.votes } : game
        )
      )

      setVotedGames(prev =>
        result.voted
          ? [...prev, gameId]
          : prev.filter(id => id !== gameId)
      )
    } catch (error) {
      console.error('Error voting:', error)
      toast.error('Failed to vote')
    }
  }, [])

  const handleRemove = useCallback(async (gameId: string, title: string) => {
    const gameToRemove = games.find(g => g.id === gameId)
    if (!gameToRemove) return

    setGames(prev => prev.filter(g => g.id !== gameId))
    setVotedGames(prev => prev.filter(id => id !== gameId))

    let undoClicked = false

    toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span>{title} removed</span>
          <button
            onClick={async () => {
              undoClicked = true
              toast.dismiss(t.id)
              setGames(prev => [...prev, gameToRemove])
              const restored = await restoreGame(gameToRemove)
              if (restored) {
                toast.success(`${title} restored!`)
              } else {
                toast.error('Failed to restore game')
                setGames(prev => prev.filter(g => g.id !== gameId))
              }
            }}
            className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
          >
            Undo
          </button>
        </div>
      ),
      { duration: 5000, icon: '🗑️' }
    )

    setTimeout(async () => {
      if (!undoClicked) {
        const success = await removeGame(gameId)
        if (!success) {
          setGames(prev => [...prev, gameToRemove])
          toast.error('Failed to remove game')
        }
      }
    }, 5500)
  }, [games])

  const handleRefresh = useCallback(async (gameId: string) => {
    const game = games.find(g => g.id === gameId)
    if (!game) return

    toast.loading('Refreshing game data...', { id: 'refresh' })

    try {
      const steamData = await fetchSteamCoverByTitle(game.title)
      if (!steamData) {
        toast.error('Could not fetch game data', { id: 'refresh' })
        return
      }

      await updateGameCover(
        game.id,
        steamData.cover,
        steamData.steam_appid,
        steamData.metacritic ?? undefined,
        steamData.trailer_url
      )

      setGames(prev =>
        prev.map(g =>
          g.id === gameId
            ? {
                ...g,
                cover: steamData.cover,
                steam_appid: steamData.steam_appid,
                rawg_id: steamData.steam_appid,
                metacritic: steamData.metacritic ?? g.metacritic,
                trailer_url: steamData.trailer_url || g.trailer_url,
                screenshots: steamData.screenshots || g.screenshots,
                platforms: steamData.platforms || g.platforms,
                developers: steamData.developers || g.developers,
                publishers: steamData.publishers || g.publishers,
                release_date: steamData.release_date || g.release_date,
                short_description: steamData.short_description || g.short_description,
                categories: steamData.categories || g.categories,
              }
            : g
        )
      )

      toast.success('Game data refreshed!', { id: 'refresh' })
    } catch (error) {
      console.error('Error refreshing game:', error)
      toast.error('Failed to refresh game data', { id: 'refresh' })
    }
  }, [games])

  const handleRefreshAll = useCallback(async () => {
    if (games.length === 0 || isRefreshingAll) return

    setIsRefreshingAll(true)
    toast.loading(`Refreshing ${games.length} games...`, { id: 'refresh-all' })

    try {
      const steamDataResults = await Promise.all(
        games.map(game =>
          fetchSteamCoverByTitle(game.title).catch(() => null)
        )
      )

      const updatedGames: Game[] = []
      let successCount = 0

      for (let i = 0; i < games.length; i++) {
        const game = games[i]
        const steamData = steamDataResults[i]

        if (steamData) {
          successCount++
          updatedGames.push({
            ...game,
            cover: steamData.cover,
            steam_appid: steamData.steam_appid,
            rawg_id: steamData.steam_appid,
            metacritic: steamData.metacritic ?? game.metacritic,
            trailer_url: steamData.trailer_url || game.trailer_url,
            screenshots: steamData.screenshots || game.screenshots,
            platforms: steamData.platforms || game.platforms,
            developers: steamData.developers || game.developers,
            publishers: steamData.publishers || game.publishers,
            release_date: steamData.release_date || game.release_date,
            short_description: steamData.short_description || game.short_description,
            categories: steamData.categories || game.categories,
          })

          updateGameCover(
            game.id,
            steamData.cover,
            steamData.steam_appid,
            steamData.metacritic ?? undefined,
            steamData.trailer_url
          )
        } else {
          updatedGames.push(game)
        }
      }

      setGames(updatedGames)
      toast.success(`Refreshed ${successCount} of ${games.length} games!`, { id: 'refresh-all' })
    } catch (error) {
      console.error('Error refreshing all games:', error)
      toast.error('Failed to refresh games', { id: 'refresh-all' })
    } finally {
      setIsRefreshingAll(false)
    }
  }, [games, isRefreshingAll])

  const handleGameAdded = useCallback((game: Game) => {
    setGames(prev => [...prev, game])
  }, [])

  const handleImported = useCallback(() => {
    loadGames()
  }, [])

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
  }, [])

  // =====================================================
  // CONTEXT VALUE
  // =====================================================

  const value: GameContextValue = {
    games,
    filteredGames,
    recentlyAddedGames,
    groupedGames,
    loading,

    searchTerm,
    setSearchTerm,
    activeFilters,
    toggleFilter,
    clearFilters,
    sortBy,
    setSortBy,
    availableFilters,

    activeSourceFilters,
    toggleSourceFilter,
    availableSources,

    viewMode,
    setViewMode,
    cardSize,
    setCardSize,
    groupBy,
    setGroupBy,
    collapsedGroups,
    toggleGroupCollapse,

    pinnedGames,
    togglePin,

    votedGames,
    handleVote,

    compareGames,
    toggleCompare,
    clearCompare,

    filterPresets,
    saveFilterPreset,
    loadFilterPreset,
    deleteFilterPreset,

    customOrder,
    setCustomOrder,

    handleRemove,
    handleRefresh,
    handleRefreshAll,
    handleGameAdded,
    handleImported,
    isRefreshingAll,

    activePoll,
    userPollRankings,
    pollResults,
    handlePollRankSelect,
    getGamePollRank,
    getGamePollPoints,
    handlePollStateChange,

    isMobile,
    searchInputRef,
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

// =====================================================
// HOOK
// =====================================================

export function useGameContext() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider')
  }
  return context
}
