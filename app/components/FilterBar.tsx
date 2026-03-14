'use client'

import { forwardRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/app/components/ui/button'
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
  const [scrolled, setScrolled] = useState(false)

  // Scroll-aware blur — strengthen glass panel as user scrolls past hero
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 72)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  const FilterButton = ({ filter, small = false, hashtag = false }: { filter: string; small?: boolean; hashtag?: boolean }) => {
    const isActive = activeFilters.includes(filter)
    const label = hashtag ? `#${filter.toLowerCase()}` : filter
    return (
      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onToggleFilter(filter)}
        className={`rounded-xl font-medium whitespace-nowrap flex items-center gap-1.5 border transition-all duration-150 ${
          small ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
        } ${hashtag ? 'font-mono' : ''} ${
          isActive
            ? 'bg-primary/15 border-primary/35 text-primary shadow-[0_0_14px_rgba(139,92,246,0.22)]'
            : 'bg-white/[0.04] border-white/[0.07] hover:border-white/[0.12] hover:bg-white/[0.07] text-text-secondary hover:text-text-primary'
        }`}
      >
        {!hashtag && <span className={isActive ? 'text-primary' : 'text-text-tertiary'}>{FILTER_ICONS[filter]}</span>}
        {label}
      </motion.button>
    )
  }

  // The FilterBar is the sticky glass panel at the top
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

      <div className="sticky top-0 z-20 pb-5">
        <div
        className="glass-strong p-3 sm:p-4 space-y-3 transition-all duration-300 relative overflow-hidden"
        style={{
          borderRadius: '2px',
          ...(scrolled ? {
            background: 'rgba(10, 15, 26, 0.96)',
            backdropFilter: 'blur(40px) saturate(220%)',
            WebkitBackdropFilter: 'blur(40px) saturate(220%)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.07), 0 8px 40px rgba(0,0,0,0.55)',
          } : {}),
        }}
      >
          {/* Top accent line — brightens on scroll */}
          <div
            className="absolute top-0 left-6 right-6 h-px pointer-events-none"
            style={{
              background: scrolled
                ? 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.55) 20%, rgba(139,92,246,0.85) 50%, rgba(139,92,246,0.55) 80%, transparent 100%)'
                : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 20%, rgba(255,255,255,0.11) 50%, rgba(255,255,255,0.07) 80%, transparent 100%)',
              transition: 'background 0.4s ease',
            }}
          />

          {/* Control row — poll + count + actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
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

              {/* Game count pill — compact context inside the glass panel */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium text-text-tertiary" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 inline-block" />
                {gameCount} {gameCount === 1 ? 'game' : 'games'}
              </div>
            </div>

            {/* Sort tabs — A-Z | VOTES, prominent at top right like Lovable */}
            <div className="hidden sm:flex items-center gap-1 mr-1">
              <button
                onClick={() => onSortChange('votes')}
                className={`px-3 py-1.5 text-[12px] font-mono font-bold rounded-lg transition-all duration-150 ${
                  sortBy === 'votes'
                    ? 'text-primary bg-primary/10 border border-primary/30'
                    : 'text-text-tertiary border border-transparent hover:border-white/[0.08] hover:text-text-secondary hover:bg-white/[0.04]'
                }`}
              >
                VOTES
              </button>
              <button
                onClick={() => onSortChange('title')}
                className={`px-3 py-1.5 text-[12px] font-mono font-bold rounded-lg transition-all duration-150 ${
                  sortBy === 'title'
                    ? 'text-primary bg-primary/10 border border-primary/30'
                    : 'text-text-tertiary border border-transparent hover:border-white/[0.08] hover:text-text-secondary hover:bg-white/[0.04]'
                }`}
              >
                A-Z
              </button>
              <div className="w-px h-5 bg-white/[0.07] mx-1" />
            </div>

          {/* Action buttons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Secondary actions - hidden on mobile */}
              <div className="hidden sm:flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onRefreshAll}
                  disabled={gameCount === 0 || isRefreshing}
                  className="p-2 rounded-lg disabled:opacity-40 text-text-tertiary hover:text-text-secondary transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                  title="Refresh all games"
                  aria-label="Refresh all games"
                >
                  <HiRefresh className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin-slow' : ''}`} aria-hidden="true" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onImport}
                  className="p-2 rounded-lg text-text-tertiary hover:text-text-secondary transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                  title="Import games"
                  aria-label="Import games from file"
                >
                  <HiUpload className="w-3.5 h-3.5" aria-hidden="true" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onShare}
                  disabled={gameCount === 0}
                  className="p-2 rounded-lg disabled:opacity-40 text-text-tertiary hover:text-text-secondary transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                  title="Share collection"
                  aria-label="Share game collection"
                >
                  <HiShare className="w-3.5 h-3.5" aria-hidden="true" />
                </motion.button>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-5 bg-white/[0.07] mx-0.5" />

              {/* Pick For Us - hidden on mobile (available in menu) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onPickForUs}
                disabled={gameCount === 0}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium text-text-secondary disabled:opacity-40 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <HiSparkles className="w-3.5 h-3.5 text-primary/70" />
                <span>Pick</span>
              </motion.button>

              {/* Add Game button */}
              <Button asChild size="sm" className="rounded-xl px-3.5 text-[13px] font-semibold tracking-[-0.01em] h-9" style={{ boxShadow: '0 4px 16px rgba(139,92,246,0.35)' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onAddGame}
                >
                  <HiPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Game</span>
                </motion.button>
              </Button>

              {/* Mobile menu button */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setMobileMenuOpen(true)}
                className="sm:hidden p-2 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center text-text-tertiary"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
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
        <div className="relative search-glow transition-all duration-200" style={{ borderRadius: '2px' }}>
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/35 transition-colors" />
          <input
            ref={ref}
            type="text"
            inputMode="search"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Search games..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="peer w-full text-[15px] placeholder-text-muted min-h-[48px] transition-all duration-200 focus:outline-none pl-11 pr-12 py-3"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '2px',
              color: '#F5F7FA',
            }}
            aria-label="Search games"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Clear search"
            >
              <HiX className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Active filter chips - shows all active filters with individual removal */}
        {(activeFilters.length > 0 || activeSourceFilters.length > 0 || searchTerm) && (
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold">Active:</span>

            {/* Search term chip */}
            {searchTerm && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSearchChange('')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/25 transition-all duration-150 group shadow-sm"
              >
                <HiSearch className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate">"{searchTerm}"</span>
                <HiX className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            )}

            {/* Source filter chips */}
            {activeSourceFilters.map(source => {
              const sourceInfo = SOURCE_FILTERS.find(s => s.source === source)
              return (
                <motion.button
                  key={source}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onToggleSourceFilter?.(source)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-400/30 text-purple-300 text-sm font-medium hover:bg-purple-500/25 transition-all duration-150 group shadow-sm"
                >
                  {sourceInfo?.icon}
                  {sourceInfo?.label || source}
                  <HiX className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              )
            })}

            {/* Regular filter chips */}
            {activeFilters.map(filter => (
              <motion.button
                key={filter}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onToggleFilter(filter)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 group border shadow-sm ${
                  PLAYER_MODE_FILTERS.includes(filter)
                    ? 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/25'
                    : PRICE_FILTERS.includes(filter)
                    ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/25'
                    : 'bg-amber-500/15 border-amber-400/30 text-amber-300 hover:bg-amber-500/25'
                }`}
              >
                {FILTER_ICONS[filter]}
                {filter}
                <HiX className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            ))}

            {/* Clear all button */}
            {(activeFilters.length > 0 || activeSourceFilters.length > 0 || searchTerm) && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  activeFilters.forEach(f => onToggleFilter(f))
                  activeSourceFilters.forEach(s => onToggleSourceFilter?.(s))
                  if (searchTerm) onSearchChange('')
                }}
                className="text-sm text-red-400/80 hover:text-red-400 px-3 py-1.5 rounded-xl border border-transparent hover:border-red-500/30 hover:bg-red-500/10 transition-all duration-150 font-medium"
              >
                Clear all
              </motion.button>
            )}
          </div>
        )}

        {/* Filters section - hidden on mobile (available in menu) */}
        <div className="hidden sm:block space-y-4">
          {/* Quick filters row - Player modes and price */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Price filters */}
            {priceFilters.map(filter => (
              <FilterButton key={filter} filter={filter} />
            ))}

            {priceFilters.length > 0 && playerModeFilters.length > 0 && (
              <div className="w-px h-6 bg-border mx-2" />
            )}

            {/* Player mode filters */}
            {playerModeFilters.map(filter => (
              <FilterButton key={filter} filter={filter} />
            ))}

            {/* Source filters */}
            {onToggleSourceFilter && availableSources.length > 0 && (
              <>
                {(priceFilters.length > 0 || playerModeFilters.length > 0) && (
                  <div className="w-px h-6 bg-border mx-3" />
                )}
                <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold mr-1">Store:</span>
                {SOURCE_FILTERS.filter(sf => availableSources.includes(sf.source)).map(({ source, icon, label }) => {
                  const isActive = activeSourceFilters.includes(source)
                  return (
                    <motion.button
                      key={source}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onToggleSourceFilter(source)}
                      className={`rounded-xl font-medium whitespace-nowrap flex items-center gap-1.5 px-3.5 py-2 text-sm border transition-all duration-150 ${
                        isActive
                          ? 'bg-violet-500/15 border-violet-400/35 text-violet-300 shadow-[0_0_14px_rgba(139,92,246,0.18)]'
                          : 'bg-white/[0.04] border-white/[0.07] hover:border-white/[0.12] hover:bg-white/[0.07] text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <span className={isActive ? 'text-violet-400' : 'text-text-tertiary'}>{icon}</span>
                      {label}
                    </motion.button>
                  )
                })}
              </>
            )}
          </div>

          {/* Genre filters */}
          {genreFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold flex items-center gap-1.5 mr-1">
                <HiTag className="w-3.5 h-3.5" />
                Genres
              </span>
              {visibleGenres.map(filter => (
                <FilterButton key={filter} filter={filter} small hashtag />
              ))}
              {hiddenGenres.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowMoreFilters(!showMoreFilters)}
                  className="px-3 py-1.5 rounded-xl text-sm font-medium bg-surface-raised border border-border hover:border-border-hover text-text-tertiary hover:text-text-secondary flex items-center gap-1.5 transition-all duration-150"
                >
                  +{hiddenGenres.length} more
                  <HiChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showMoreFilters ? 'rotate-180' : ''}`} />
                </motion.button>
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
                className="flex flex-wrap items-center gap-2.5 pl-20"
              >
                {hiddenGenres.map(filter => (
                  <FilterButton key={filter} filter={filter} small hashtag />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active filters count & clear */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-3 pt-2">
              <span className="text-sm text-text-tertiary">
                {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''} active
              </span>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => activeFilters.forEach(f => onToggleFilter(f))}
                className="text-sm text-primary/80 hover:text-primary font-medium transition-colors"
              >
                Clear all
              </motion.button>
            </div>
          )}
        </div>

        {/* Mobile active filters indicator */}
        {activeFilters.length > 0 && (
          <div className="sm:hidden flex items-center justify-between py-2">
            <span className="text-sm text-text-tertiary">
              {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''} active
            </span>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => activeFilters.forEach(f => onToggleFilter(f))}
              className="text-sm text-primary/80 hover:text-primary font-medium transition-colors"
            >
              Clear all
            </motion.button>
          </div>
        )}

        {/* Toolbar row - hidden on mobile */}
        <div className="hidden sm:flex items-center justify-between gap-4 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View mode */}
            <div className="flex items-center rounded-xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2.5 transition-all duration-150 ${
                  viewMode === 'grid'
                    ? 'text-primary bg-primary/12'
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-white/[0.05]'
                }`}
                title="Grid view"
              >
                <HiViewGrid className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-white/[0.07]" />
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2.5 transition-all duration-150 ${
                  viewMode === 'list'
                    ? 'text-primary bg-primary/12'
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-white/[0.05]'
                }`}
                title="List view"
              >
                <HiViewList className="w-4 h-4" />
              </button>
            </div>

            {/* Group by */}
            <div className="flex items-center rounded-xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span className="px-3 text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-semibold">Group:</span>
              {(['none', 'genre', 'price'] as const).map((group) => (
                <button
                  key={group}
                  onClick={() => onGroupByChange(group)}
                  className={`px-3 py-2 text-sm font-medium transition-all duration-150 border-l border-white/[0.07] ${
                    groupBy === group
                      ? 'text-primary bg-primary/12'
                      : 'text-text-tertiary hover:text-text-secondary hover:bg-white/[0.05]'
                  }`}
                >
                  {group === 'none' ? 'Off' : group.charAt(0).toUpperCase() + group.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Presets */}
            <div className="relative group">
              <button className="bg-surface-raised border border-border hover:border-border-hover rounded-xl p-2.5 text-text-tertiary hover:text-text-primary transition-all duration-150">
                <HiBookmark className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-52 bg-surface-raised border border-border rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 shadow-card-lift">
                {filterPresets.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-text-tertiary">No saved presets</div>
                ) : (
                  filterPresets.map(preset => (
                    <div key={preset.id} className="flex items-center justify-between px-4 py-2 hover:bg-surface-hover transition-colors">
                      <button
                        onClick={() => onLoadPreset(preset)}
                        className="text-sm text-text-secondary hover:text-text-primary flex-1 text-left truncate"
                      >
                        {preset.name}
                      </button>
                      <button
                        onClick={() => onDeletePreset(preset.id)}
                        className="p-1.5 text-red-400/60 hover:text-red-400 ml-2 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <HiTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
                <div className="border-t border-border mt-2 pt-2 mx-2">
                  <button
                    onClick={() => {
                      const name = prompt('Preset name:')
                      if (name) onSavePreset(name)
                    }}
                    disabled={activeFilters.length === 0}
                    className="w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover text-left rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
