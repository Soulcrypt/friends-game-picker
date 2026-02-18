'use client'

import { forwardRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
} from 'react-icons/hi'
import { FaGamepad, FaSteam } from 'react-icons/fa'
import { SiEpicgames, SiGogdotcom } from 'react-icons/si'
import { FaXbox } from 'react-icons/fa'
import { TbWorldWww } from 'react-icons/tb'
import type { ViewMode, CardSize, FilterPreset, GameSource } from '@/lib/types'
import MobileMenu from './MobileMenu'

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
}, ref) {
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight leading-none truncate">
                <span className="text-gradient">What are we playing?</span>
              </h1>
              <p className="text-xs text-white/40 mt-1.5 uppercase tracking-wide font-medium">
                {gameCount} {gameCount === 1 ? 'game' : 'games'} in the pool
              </p>
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
