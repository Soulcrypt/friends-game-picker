'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  ReactNode,
} from 'react'
import { useState } from 'react'
import type {
  Game,
  ViewMode,
  CardSize,
  FilterPreset,
  GameSource,
  Poll,
  GameResult,
} from './types'

// Hooks
import { useMobileDetection } from './hooks/useMobileDetection'
import { useCompare } from './hooks/useCompare'
import { useViewSettings } from './hooks/useViewSettings'
import { usePoll } from './hooks/usePoll'
import { usePinnedGames } from './hooks/usePinnedGames'
import { useFilterPresets } from './hooks/useFilterPresets'
import { useGameData } from './hooks/useGameData'
import { useFiltering } from './hooks/useFiltering'

// =====================================================
// CONTEXT TYPES
// =====================================================

interface GameDataContextValue {
  games: Game[]
  loading: boolean
  votedGames: string[]
  isRefreshingAll: boolean
  handleVote: (gameId: string) => Promise<void>
  handleRemove: (gameId: string, title: string) => Promise<void>
  handleRefresh: (gameId: string) => Promise<void>
  handleRefreshAll: () => Promise<void>
  handleGameAdded: (game: Game) => void
  handleImported: () => void
}

interface FilterContextValue {
  searchTerm: string
  setSearchTerm: (term: string) => void
  activeFilters: string[]
  toggleFilter: (filter: string) => void
  clearFilters: () => void
  sortBy: 'votes' | 'title'
  setSortBy: (sort: 'votes' | 'title') => void
  availableFilters: string[]
  activeSourceFilters: GameSource[]
  toggleSourceFilter: (source: GameSource) => void
  availableSources: GameSource[]
  filteredGames: Game[]
  recentlyAddedGames: Game[]
  groupedGames: [string, Game[]][] | null
}

interface ViewContextValue {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  cardSize: CardSize
  setCardSize: (size: CardSize) => void
  groupBy: 'none' | 'genre' | 'price'
  setGroupBy: (group: 'none' | 'genre' | 'price') => void
  collapsedGroups: string[]
  toggleGroupCollapse: (groupName: string) => void
  isMobile: boolean
}

interface PollContextValue {
  activePoll: Poll | null
  userPollRankings: { [rank: number]: string }
  pollResults: GameResult[]
  handlePollRankSelect: (gameId: string, rank: number | null) => Promise<void>
  getGamePollRank: (gameId: string) => number | null
  getGamePollPoints: (gameId: string) => number
  handlePollStateChange: () => void
}

interface InteractionContextValue {
  pinnedGames: string[]
  togglePin: (gameId: string) => void
  compareGames: string[]
  toggleCompare: (gameId: string) => void
  clearCompare: () => void
  filterPresets: FilterPreset[]
  saveFilterPreset: (name: string) => void
  loadFilterPreset: (preset: FilterPreset) => void
  deleteFilterPreset: (presetId: string) => void
  customOrder: string[]
  setCustomOrder: (order: string[]) => void
  searchInputRef: React.RefObject<HTMLInputElement>
}

// Unified type for backward compat (useGameContext)
interface GameContextValue extends
  GameDataContextValue,
  FilterContextValue,
  ViewContextValue,
  PollContextValue,
  InteractionContextValue {}

// =====================================================
// CONTEXTS
// =====================================================

const GameDataContext = createContext<GameDataContextValue | null>(null)
const FilterContext = createContext<FilterContextValue | null>(null)
const ViewContext = createContext<ViewContextValue | null>(null)
const PollContext = createContext<PollContextValue | null>(null)
const InteractionContext = createContext<InteractionContextValue | null>(null)

// Legacy unified context for backward compatibility
const GameContext = createContext<GameContextValue | null>(null)

// =====================================================
// PROVIDER
// =====================================================

interface GameProviderProps {
  children: ReactNode
  userId?: string
}

export function GameProvider({ children, userId }: GameProviderProps) {
  // Compose all hooks
  const gameData = useGameData()
  const isMobile = useMobileDetection()
  const compare = useCompare()
  const viewSettings = useViewSettings()
  const poll = usePoll(userId)
  const pinned = usePinnedGames()
  const [customOrder, setCustomOrder] = useState<string[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filtering depends on games, pinned, custom order, and groupBy
  const filtering = useFiltering({
    games: gameData.games,
    pinnedGames: pinned.pinnedGames,
    customOrder,
    groupBy: viewSettings.groupBy,
  })

  // Filter presets need bidirectional access to filter state
  const presets = useFilterPresets({
    activeFilters: filtering.activeFilters,
    sortBy: filtering.sortBy,
    setActiveFilters: (filters: string[]) => {
      // Use the setter from filtering — need to set it via the filter state
      filtering.setActiveFilters(filters)
    },
    setSortBy: filtering.setSortBy,
  })

  // Initialize data on mount
  useEffect(() => {
    gameData.initializeData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Memoize individual context values to prevent unnecessary re-renders

  const gameDataValue = useMemo<GameDataContextValue>(() => ({
    games: gameData.games,
    loading: gameData.loading,
    votedGames: gameData.votedGames,
    isRefreshingAll: gameData.isRefreshingAll,
    handleVote: gameData.handleVote,
    handleRemove: gameData.handleRemove,
    handleRefresh: gameData.handleRefresh,
    handleRefreshAll: gameData.handleRefreshAll,
    handleGameAdded: gameData.handleGameAdded,
    handleImported: gameData.handleImported,
  }), [
    gameData.games, gameData.loading, gameData.votedGames, gameData.isRefreshingAll,
    gameData.handleVote, gameData.handleRemove, gameData.handleRefresh,
    gameData.handleRefreshAll, gameData.handleGameAdded, gameData.handleImported,
  ])

  const filterValue = useMemo<FilterContextValue>(() => ({
    searchTerm: filtering.searchTerm,
    setSearchTerm: filtering.setSearchTerm,
    activeFilters: filtering.activeFilters,
    toggleFilter: filtering.toggleFilter,
    clearFilters: filtering.clearFilters,
    sortBy: filtering.sortBy,
    setSortBy: filtering.setSortBy,
    availableFilters: filtering.availableFilters,
    activeSourceFilters: filtering.activeSourceFilters,
    toggleSourceFilter: filtering.toggleSourceFilter,
    availableSources: filtering.availableSources,
    filteredGames: filtering.filteredGames,
    recentlyAddedGames: filtering.recentlyAddedGames,
    groupedGames: filtering.groupedGames,
  }), [
    filtering.searchTerm, filtering.setSearchTerm, filtering.activeFilters,
    filtering.toggleFilter, filtering.clearFilters, filtering.sortBy,
    filtering.setSortBy, filtering.availableFilters, filtering.activeSourceFilters,
    filtering.toggleSourceFilter, filtering.availableSources, filtering.filteredGames,
    filtering.recentlyAddedGames, filtering.groupedGames,
  ])

  const viewValue = useMemo<ViewContextValue>(() => ({
    viewMode: viewSettings.viewMode,
    setViewMode: viewSettings.setViewMode,
    cardSize: viewSettings.cardSize,
    setCardSize: viewSettings.setCardSize,
    groupBy: viewSettings.groupBy,
    setGroupBy: viewSettings.setGroupBy,
    collapsedGroups: viewSettings.collapsedGroups,
    toggleGroupCollapse: viewSettings.toggleGroupCollapse,
    isMobile,
  }), [
    viewSettings.viewMode, viewSettings.setViewMode, viewSettings.cardSize,
    viewSettings.setCardSize, viewSettings.groupBy, viewSettings.setGroupBy,
    viewSettings.collapsedGroups, viewSettings.toggleGroupCollapse, isMobile,
  ])

  const pollValue = useMemo<PollContextValue>(() => ({
    activePoll: poll.activePoll,
    userPollRankings: poll.userPollRankings,
    pollResults: poll.pollResults,
    handlePollRankSelect: poll.handlePollRankSelect,
    getGamePollRank: poll.getGamePollRank,
    getGamePollPoints: poll.getGamePollPoints,
    handlePollStateChange: poll.handlePollStateChange,
  }), [
    poll.activePoll, poll.userPollRankings, poll.pollResults,
    poll.handlePollRankSelect, poll.getGamePollRank, poll.getGamePollPoints,
    poll.handlePollStateChange,
  ])

  const interactionValue = useMemo<InteractionContextValue>(() => ({
    pinnedGames: pinned.pinnedGames,
    togglePin: pinned.togglePin,
    compareGames: compare.compareGames,
    toggleCompare: compare.toggleCompare,
    clearCompare: compare.clearCompare,
    filterPresets: presets.filterPresets,
    saveFilterPreset: presets.saveFilterPreset,
    loadFilterPreset: presets.loadFilterPreset,
    deleteFilterPreset: presets.deleteFilterPreset,
    customOrder,
    setCustomOrder,
    searchInputRef,
  }), [
    pinned.pinnedGames, pinned.togglePin,
    compare.compareGames, compare.toggleCompare, compare.clearCompare,
    presets.filterPresets, presets.saveFilterPreset, presets.loadFilterPreset,
    presets.deleteFilterPreset, customOrder,
  ])

  // Unified value for backward compatibility
  const unifiedValue = useMemo<GameContextValue>(() => ({
    ...gameDataValue,
    ...filterValue,
    ...viewValue,
    ...pollValue,
    ...interactionValue,
  }), [gameDataValue, filterValue, viewValue, pollValue, interactionValue])

  return (
    <GameDataContext.Provider value={gameDataValue}>
      <FilterContext.Provider value={filterValue}>
        <ViewContext.Provider value={viewValue}>
          <PollContext.Provider value={pollValue}>
            <InteractionContext.Provider value={interactionValue}>
              <GameContext.Provider value={unifiedValue}>
                {children}
              </GameContext.Provider>
            </InteractionContext.Provider>
          </PollContext.Provider>
        </ViewContext.Provider>
      </FilterContext.Provider>
    </GameDataContext.Provider>
  )
}

// =====================================================
// HOOKS
// =====================================================

/** Unified hook — backward compatible, subscribes to all context changes */
export function useGameContext() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider')
  }
  return context
}

/** Granular hook — only re-renders on game data changes (games, votes, loading) */
export function useGameDataContext() {
  const context = useContext(GameDataContext)
  if (!context) {
    throw new Error('useGameDataContext must be used within a GameProvider')
  }
  return context
}

/** Granular hook — only re-renders on filter/sort/search changes */
export function useFilterContext() {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error('useFilterContext must be used within a GameProvider')
  }
  return context
}

/** Granular hook — only re-renders on view setting changes */
export function useViewContext() {
  const context = useContext(ViewContext)
  if (!context) {
    throw new Error('useViewContext must be used within a GameProvider')
  }
  return context
}

/** Granular hook — only re-renders on poll state changes */
export function usePollContext() {
  const context = useContext(PollContext)
  if (!context) {
    throw new Error('usePollContext must be used within a GameProvider')
  }
  return context
}

/** Granular hook — only re-renders on interaction changes (pin, compare, presets, order) */
export function useInteractionContext() {
  const context = useContext(InteractionContext)
  if (!context) {
    throw new Error('useInteractionContext must be used within a GameProvider')
  }
  return context
}
