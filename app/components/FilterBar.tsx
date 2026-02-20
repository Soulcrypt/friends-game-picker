'use client'

import { forwardRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  HiSearch,
  HiPlus,
  HiUpload,
  HiSparkles,
  HiUsers,
  HiRefresh,
  HiViewGrid,
  HiViewList,
  HiShare,
  HiBookmark,
  HiTrash,
  HiChevronDown,
  HiCurrencyDollar,
  HiTag,
  HiSortDescending,
  HiSortAscending,
  HiX,
  HiMenu,
  HiClock,
  HiUserGroup,
  HiCollection,
} from 'react-icons/hi'
import { HiTrophy } from 'react-icons/hi2'
import { FaGamepad, FaSteam } from 'react-icons/fa'
import { SiEpicgames, SiGogdotcom } from 'react-icons/si'
import { FaXbox } from 'react-icons/fa'
import { TbWorldWww } from 'react-icons/tb'
import type { ViewMode, CardSize, FilterPreset, GameSource, Poll, Game, GameResult } from '@/lib/types'
import { getActivePoll, calculateResults, getTotalVotersForPoll } from '@/lib/votes'
import MobileMenu from './MobileMenu'
import PollManager from './PollManager'
import RankedVoting from './RankedVoting'
import PollResults from './PollResults'

interface FilterBarProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  activeFilters: string[]
  onToggleFilter: (filter: string) => void
  sortBy: 'votes' | 'title'
  onSortChange: (sort: 'votes' | 'title') => void
  onAddGame: () => void
  onImport: () => void
  onPickForUs: () => void
  onRefreshAll: () => void
  onShare: () => void
  isRefreshing: boolean
  gameCount: number
  availableFilters: string[]
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  cardSize: CardSize
  onCardSizeChange: (size: CardSize) => void
  groupBy: 'none' | 'genre' | 'price'
  onGroupByChange: (group: 'none' | 'genre' | 'price') => void
  filterPresets: FilterPreset[]
  onSavePreset: (name: string) => void
  onLoadPreset: (preset: FilterPreset) => void
  onDeletePreset: (presetId: string) => void
  // Source filters
  activeSourceFilters?: GameSource[]
  onToggleSourceFilter?: (source: GameSource) => void
  availableSources?: GameSource[]
  // Poll integration
  games: Game[]
  onPollStateChange?: () => void
}

// Helper to get countdown urgency class
function getCountdownClass(timeRemaining: string | null): string {
  if (!timeRemaining) return ''
  const match = timeRemaining.match(/^(\d+)([msh])/)
  if (!match) return ''
  const value = parseInt(match[1])
  const unit = match[2]
  if (unit === 's' || (unit === 'm' && value < 5)) return 'text-red-400'
  if (unit === 'm' && value < 30) return 'text-amber-400'
  return ''
}

// Category definitions for organizing filters
const PLAYER_MODE_FILTERS = ['Single-player', 'Multiplayer', 'Co-op', 'PvP']
const PRICE_FILTERS = ['Free', 'Paid']

// Source filter definitions with icons and colors - using consistent glass styling
const SOURCE_FILTERS: { source: GameSource; icon: JSX.Element; label: string }[] = [
  { source: 'steam', icon: <FaSteam className="w-3 h-3" />, label: 'Steam' },
  { source: 'epic', icon: <SiEpicgames className="w-3 h-3" />, label: 'Epic' },
  { source: 'xbox', icon: <FaXbox className="w-3 h-3" />, label: 'Xbox' },
  { source: 'gog', icon: <SiGogdotcom className="w-3 h-3" />, label: 'GOG' },
  { source: 'igdb', icon: <TbWorldWww className="w-3 h-3" />, label: 'Other' },
]

// Icons for specific filters
const FILTER_ICONS: Record<string, JSX.Element> = {
  'Multiplayer': <HiUsers className="w-3 h-3" />,
  'Co-op': <HiUsers className="w-3 h-3" />,
  'Single-player': <FaGamepad className="w-3 h-3" />,
  'PvP': <HiUsers className="w-3 h-3" />,
  'Free': <HiCurrencyDollar className="w-3 h-3" />,
  'Paid': <HiCurrencyDollar className="w-3 h-3" />,
}

const FilterBar = forwardRef<HTMLInputElement, FilterBarProps>(function FilterBar({
  searchTerm,
  onSearchChange,
  activeFilters,
  onToggleFilter,
  sortBy,
  onSortChange,
  onAddGame,
  onImport,
  onPickForUs,
  onRefreshAll,
  onShare,
  isRefreshing,
  gameCount,
  availableFilters,
  viewMode,
  onViewModeChange,
  cardSize,
  onCardSizeChange,
  groupBy,
  onGroupByChange,
  filterPresets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  activeSourceFilters = [],
  onToggleSourceFilter,
  availableSources = [],
  games,
  onPollStateChange,
}, ref) {
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Poll state
  const [poll, setPoll] = useState<Poll | null>(null)
  const [pollLoading, setPollLoading] = useState(true)
  const [pollExpanded, setPollExpanded] = useState(false)
  const [topResults, setTopResults] = useState<GameResult[]>([])
  const [totalVoters, setTotalVoters] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)
  const [showPollResults, setShowPollResults] = useState(false)

  // Load active poll
  useEffect(() => {
    loadPoll()
  }, [])

  // Update countdown timer
  useEffect(() => {
    if (!poll?.ends_at) {
      setTimeRemaining(null)
      return
    }

    const updateTimer = () => {
      const now = new Date()
      const end = new Date(poll.ends_at!)
      const diff = end.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining('Ended')
        loadPoll()
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (hours > 24) {
        const days = Math.floor(hours / 24)
        setTimeRemaining(`${days}d ${hours % 24}h`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`)
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`)
      } else {
        setTimeRemaining(`${seconds}s`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [poll?.ends_at])

  // Load top results preview
  useEffect(() => {
    if (!poll || poll.status !== 'active') return

    const loadResults = async () => {
      try {
        const [results, voters] = await Promise.all([
          calculateResults(poll.id),
          getTotalVotersForPoll(poll.id),
        ])
        setTopResults(results.slice(0, 3))
        setTotalVoters(voters)
      } catch (error) {
        console.error('Error loading results preview:', error)
      }
    }

    loadResults()
    const interval = setInterval(loadResults, 30000)
    return () => clearInterval(interval)
  }, [poll?.id, poll?.status])

  const loadPoll = async () => {
    setPollLoading(true)
    try {
      const activePoll = await getActivePoll()
      setPoll(activePoll)
      if (activePoll?.status === 'ended') {
        setShowPollResults(true)
      }
    } catch (error) {
      console.error('Error loading poll:', error)
    } finally {
      setPollLoading(false)
    }
  }

  const handlePollCreated = (newPoll: Poll) => {
    setPoll(newPoll)
    setPollExpanded(true)
    setShowPollResults(false)
    onPollStateChange?.()
  }

  const handlePollEnded = () => {
    if (poll) {
      setPoll({ ...poll, status: 'ended' })
    }
    setShowPollResults(true)
    onPollStateChange?.()
  }

  const handleVoteSubmitted = () => {
    if (poll) {
      calculateResults(poll.id).then(results => setTopResults(results.slice(0, 3)))
      getTotalVotersForPoll(poll.id).then(setTotalVoters)
    }
    onPollStateChange?.()
  }

  const handleCreateNewPoll = () => {
    setPoll(null)
    setShowPollResults(false)
    setTopResults([])
    setTotalVoters(0)
  }

  const countdownClass = getCountdownClass(timeRemaining)

  // Organize filters into categories (deduplicated)
  const playerModeFilters = PLAYER_MODE_FILTERS.filter(f => availableFilters.includes(f))
  const priceFilters = PRICE_FILTERS.filter(f => availableFilters.includes(f))

  // Genre filters = everything else (excluding player modes and price)
  const genreFilters = availableFilters
    .filter(f => !PLAYER_MODE_FILTERS.includes(f) && !PRICE_FILTERS.includes(f))
    .sort((a, b) => a.localeCompare(b))

  // Show first 8 genres, rest in "more"
  const visibleGenres = genreFilters.slice(0, 8)
  const hiddenGenres = genreFilters.slice(8)

  const FilterButton = ({ filter, small = false }: { filter: string; small?: boolean }) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onToggleFilter(filter)}
      className={`rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
        small ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs'
      } ${
        activeFilters.includes(filter)
          ? 'btn-primary'
          : 'btn-secondary'
      }`}
    >
      {FILTER_ICONS[filter]}
      {filter}
    </motion.button>
  )

  return (
    <>
      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        cardSize={cardSize}
        onCardSizeChange={onCardSizeChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
        groupBy={groupBy}
        onGroupByChange={onGroupByChange}
        onRefreshAll={onRefreshAll}
        onImport={onImport}
        onShare={onShare}
        onPickForUs={onPickForUs}
        isRefreshing={isRefreshing}
        gameCount={gameCount}
        activeFilters={activeFilters}
        onToggleFilter={onToggleFilter}
        availableFilters={availableFilters}
        filterPresets={filterPresets}
        onSavePreset={onSavePreset}
        onLoadPreset={onLoadPreset}
        onDeletePreset={onDeletePreset}
        activeSourceFilters={activeSourceFilters}
        onToggleSourceFilter={onToggleSourceFilter}
        availableSources={availableSources}
      />

      <div className="sticky top-0 z-20 pb-4">
        <div className="glass-strong rounded-2xl p-4 sm:p-5 space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Poll indicator button */}
              {!pollLoading && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPollExpanded(!pollExpanded)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all shrink-0 ${
                    poll
                      ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 hover:border-purple-500/50'
                      : 'glass glass-hover'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    poll
                      ? 'bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/20'
                      : 'bg-white/5'
                  }`}>
                    <HiTrophy className={`w-4 h-4 ${poll ? 'text-white' : 'text-white/30'}`} />
                  </div>
                  {poll ? (
                    <div className="hidden sm:flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-white/70 font-medium max-w-[100px] truncate">{poll.title}</span>
                      <span className="text-white/40">·</span>
                      <span className="text-white/50 flex items-center gap-1">
                        <HiUserGroup className="w-3 h-3" />
                        {totalVoters}
                      </span>
                      {timeRemaining && (
                        <>
                          <span className="text-white/40">·</span>
                          <span className={`flex items-center gap-1 ${countdownClass || 'text-amber-400'}`}>
                            <HiClock className="w-3 h-3" />
                            {timeRemaining}
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="hidden sm:block text-xs text-white/40">Start Poll</span>
                  )}
                  <motion.div
                    animate={{ rotate: pollExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-white/40"
                  >
                    <HiChevronDown className="w-4 h-4" />
                  </motion.div>
                </motion.button>
              )}

              {/* Title and count */}
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold tracking-tight leading-none truncate">
                  <span className="text-gradient">What are we playing?</span>
                </h1>
                <p className="text-xs text-white/40 mt-1 uppercase tracking-wide font-medium">
                  {gameCount} {gameCount === 1 ? 'game' : 'games'}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Secondary actions - hidden on mobile */}
              <div className="hidden sm:flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onRefreshAll}
                  disabled={gameCount === 0 || isRefreshing}
                  className="btn-secondary rounded-xl p-2.5 disabled:opacity-50"
                  title="Refresh all games"
                  aria-label="Refresh all games"
                >
                  <HiRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin-slow' : ''}`} aria-hidden="true" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onImport}
                  className="btn-secondary rounded-xl p-2.5"
                  title="Import games"
                  aria-label="Import games from file"
                >
                  <HiUpload className="w-4 h-4" aria-hidden="true" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onShare}
                  disabled={gameCount === 0}
                  className="btn-secondary rounded-xl p-2.5 disabled:opacity-50"
                  title="Share collection"
                  aria-label="Share game collection"
                >
                  <HiShare className="w-4 h-4" aria-hidden="true" />
                </motion.button>
              </div>

              {/* Pick For Us - hidden on mobile (available in menu) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onPickForUs}
                disabled={gameCount === 0}
                className="hidden sm:flex btn-secondary rounded-xl px-4 py-2.5 text-sm items-center gap-2 disabled:opacity-50"
              >
                <HiSparkles className="w-4 h-4" />
                <span>Pick For Us</span>
              </motion.button>

              {/* Add Game button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAddGame}
                className="btn-primary rounded-xl px-4 py-2.5 text-sm flex items-center gap-2 min-h-[44px]"
              >
                <HiPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Game</span>
              </motion.button>

              {/* Mobile menu button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMobileMenuOpen(true)}
                className="sm:hidden btn-secondary rounded-xl p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Menu"
                aria-label="Open menu"
                aria-expanded={mobileMenuOpen}
              >
                <HiMenu className="w-5 h-5" aria-hidden="true" />
              </motion.button>
            </div>
          </div>

          {/* Expandable Poll Panel */}
          <AnimatePresence initial={false}>
            {pollExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="pt-2 pb-1">
                  <div className="divider-gradient mb-4" />

                  {/* Poll Results View */}
                  {(poll?.status === 'ended' || showPollResults) && poll ? (
                    <PollResults
                      poll={poll}
                      onCreateNewPoll={handleCreateNewPoll}
                    />
                  ) : (
                    <div className="space-y-4">
                      {/* Poll Manager (create/end) */}
                      <PollManager
                        activePoll={poll}
                        onPollCreated={handlePollCreated}
                        onPollEnded={handlePollEnded}
                      />

                      {/* Voting UI */}
                      {poll && poll.status === 'active' && (
                        <div>
                          <div className="divider-gradient mb-4" />
                          <h4 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            Cast Your Vote
                          </h4>
                          <RankedVoting
                            poll={poll}
                            games={games}
                            onVoteSubmitted={handleVoteSubmitted}
                          />
                        </div>
                      )}

                      {/* Live Results Preview */}
                      {poll && topResults.length > 0 && (
                        <div>
                          <div className="divider-gradient mb-4" />
                          <h4 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Current Standings
                          </h4>
                          <div className="space-y-2">
                            {topResults.map((result, i) => (
                              <motion.div
                                key={result.game_id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08 }}
                                whileHover={{ scale: 1.01, x: 4 }}
                                className={`flex items-center gap-3 glass rounded-lg p-2 transition-all cursor-default ${
                                  i === 0 ? 'ring-1 ring-yellow-500/20' : ''
                                }`}
                              >
                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shadow-lg ${
                                  i === 0
                                    ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-yellow-500/30'
                                    : i === 1
                                    ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800'
                                    : 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-amber-600/20'
                                }`}>
                                  {i + 1}
                                </span>
                                {result.game?.cover && (
                                  <img
                                    src={result.game.cover}
                                    alt={result.game.title}
                                    className="w-14 h-8 rounded-lg object-cover"
                                  />
                                )}
                                <span className="flex-1 text-sm text-white truncate font-medium">
                                  {result.game?.title}
                                </span>
                                <span className={`text-sm font-bold ${
                                  i === 0 ? 'text-yellow-400' : 'text-white/70'
                                }`}>
                                  {result.total_points} pts
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* View Poll History Link */}
                      <div className="pt-2">
                        <div className="divider-gradient mb-4" />
                        <Link
                          href="/polls"
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl glass glass-hover text-sm text-white/50 hover:text-white transition-all hover:scale-[1.01]"
                        >
                          <HiCollection className="w-4 h-4" />
                          View Poll History
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        {/* Search bar */}
        <div className="relative">
          <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            ref={ref}
            type="text"
            inputMode="search"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Search games... (press / to focus)"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full glass-input rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-white/30 min-h-[44px]"
            aria-label="Search games"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Clear search"
            >
              <HiX className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters section - hidden on mobile (available in menu) */}
        <div className="hidden sm:block space-y-3">
          {/* Quick filters row - Player modes and price */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Price filters */}
            {priceFilters.map(filter => (
              <FilterButton key={filter} filter={filter} />
            ))}

            {priceFilters.length > 0 && playerModeFilters.length > 0 && (
              <div className="w-px h-5 bg-white/10 mx-1" />
            )}

            {/* Player mode filters */}
            {playerModeFilters.map(filter => (
              <FilterButton key={filter} filter={filter} />
            ))}

            {/* Source filters */}
            {onToggleSourceFilter && availableSources.length > 0 && (
              <>
                {(priceFilters.length > 0 || playerModeFilters.length > 0) && (
                  <div className="w-px h-5 bg-white/10 mx-2" />
                )}
                <span className="text-xs text-white/40 uppercase tracking-wide">Store:</span>
                {SOURCE_FILTERS.filter(sf => availableSources.includes(sf.source)).map(({ source, icon, label }) => (
                  <motion.button
                    key={source}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onToggleSourceFilter(source)}
                    className={`rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1.5 px-3 py-2 text-xs ${
                      activeSourceFilters.includes(source)
                        ? 'btn-primary'
                        : 'btn-secondary'
                    }`}
                  >
                    {icon}
                    {label}
                  </motion.button>
                ))}
              </>
            )}
          </div>

          {/* Genre filters */}
          {genreFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/30 uppercase tracking-wider mr-1">
                <HiTag className="w-3 h-3 inline mr-1" />
                Genres
              </span>
              {visibleGenres.map(filter => (
                <FilterButton key={filter} filter={filter} small />
              ))}
              {hiddenGenres.length > 0 && (
                <button
                  onClick={() => setShowMoreFilters(!showMoreFilters)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium glass text-white/40 hover:text-white/70 flex items-center gap-1"
                >
                  +{hiddenGenres.length} more
                  <HiChevronDown className={`w-3 h-3 transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          )}

          {/* Expanded genres */}
          <AnimatePresence>
            {showMoreFilters && hiddenGenres.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap items-center gap-2 pl-16"
              >
                {hiddenGenres.map(filter => (
                  <FilterButton key={filter} filter={filter} small />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active filters count & clear */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">
                {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''} active
              </span>
              <button
                onClick={() => activeFilters.forEach(f => onToggleFilter(f))}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Mobile active filters indicator */}
        {activeFilters.length > 0 && (
          <div className="sm:hidden flex items-center justify-between">
            <span className="text-xs text-white/40">
              {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''} active
            </span>
            <button
              onClick={() => activeFilters.forEach(f => onToggleFilter(f))}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Toolbar row - hidden on mobile (available in menu) */}
        <div className="hidden sm:flex items-center justify-between gap-3 pt-2 border-t border-white/[0.04]">
          <div className="flex items-center gap-2 flex-wrap">
            {/* View mode */}
            <div className="flex items-center glass rounded-lg overflow-hidden">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 transition-all ${
                  viewMode === 'grid' ? 'text-white bg-white/10' : 'text-white/40 hover:text-white/60'
                }`}
                title="Grid view"
              >
                <HiViewGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 transition-all ${
                  viewMode === 'list' ? 'text-white bg-white/10' : 'text-white/40 hover:text-white/60'
                }`}
                title="List view"
              >
                <HiViewList className="w-4 h-4" />
              </button>
            </div>

            {/* Card size (grid only) */}
            {viewMode === 'grid' && (
              <div className="flex items-center glass rounded-lg overflow-hidden">
                {(['small', 'medium', 'large'] as const).map((size, i) => (
                  <button
                    key={size}
                    onClick={() => onCardSizeChange(size)}
                    className={`px-2.5 py-1.5 text-xs font-medium transition-all ${
                      cardSize === size ? 'text-white bg-white/10' : 'text-white/40 hover:text-white/60'
                    }`}
                    title={`${size.charAt(0).toUpperCase() + size.slice(1)} cards`}
                  >
                    {size[0].toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {/* Group by */}
            <div className="flex items-center glass rounded-lg overflow-hidden">
              <span className="px-2 text-xs text-white/30">Group:</span>
              {(['none', 'genre', 'price'] as const).map((group) => (
                <button
                  key={group}
                  onClick={() => onGroupByChange(group)}
                  className={`px-2 py-1.5 text-xs font-medium transition-all ${
                    groupBy === group ? 'text-white bg-white/10' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {group === 'none' ? 'Off' : group.charAt(0).toUpperCase() + group.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="flex items-center glass rounded-lg overflow-hidden">
              <button
                onClick={() => onSortChange('votes')}
                className={`px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1 ${
                  sortBy === 'votes' ? 'text-white bg-white/10' : 'text-white/40 hover:text-white/60'
                }`}
              >
                <HiSortDescending className="w-3 h-3" />
                Top
              </button>
              <button
                onClick={() => onSortChange('title')}
                className={`px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1 ${
                  sortBy === 'title' ? 'text-white bg-white/10' : 'text-white/40 hover:text-white/60'
                }`}
              >
                <HiSortAscending className="w-3 h-3" />
                A-Z
              </button>
            </div>

            {/* Presets */}
            <div className="relative group">
              <button className="glass glass-hover rounded-lg p-2 text-white/50 hover:text-white transition-colors">
                <HiBookmark className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 glass-strong rounded-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                {filterPresets.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-white/40">No saved presets</div>
                ) : (
                  filterPresets.map(preset => (
                    <div key={preset.id} className="flex items-center justify-between px-3 py-1.5 hover:bg-white/5">
                      <button
                        onClick={() => onLoadPreset(preset)}
                        className="text-xs text-white/70 hover:text-white flex-1 text-left truncate"
                      >
                        {preset.name}
                      </button>
                      <button
                        onClick={() => onDeletePreset(preset.id)}
                        className="p-1 text-red-400/60 hover:text-red-400 ml-2"
                      >
                        <HiTrash className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
                <div className="border-t border-white/[0.06] mt-1 pt-1">
                  <button
                    onClick={() => {
                      const name = prompt('Preset name:')
                      if (name) onSavePreset(name)
                    }}
                    disabled={activeFilters.length === 0}
                    className="w-full px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/5 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + Save current filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
})

export default FilterBar
