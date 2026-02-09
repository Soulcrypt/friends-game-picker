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
} from 'react-icons/hi'
import { FaGamepad } from 'react-icons/fa'
import type { ViewMode, CardSize, FilterPreset } from '@/lib/types'

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
}

// Category definitions for organizing filters
const PLAYER_MODE_FILTERS = ['Single-player', 'Multiplayer', 'Co-op', 'PvP']
const PRICE_FILTERS = ['Free', 'Paid']

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
}, ref) {
  const [showMoreFilters, setShowMoreFilters] = useState(false)

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
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onToggleFilter(filter)}
      className={`rounded-full font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
        small ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
      } ${
        activeFilters.includes(filter)
          ? 'text-white shadow-lg'
          : 'glass text-white/50 hover:text-white/80'
      }`}
      style={
        activeFilters.includes(filter)
          ? {
              background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
              boxShadow: '0 2px 10px rgba(139, 92, 246, 0.3)',
            }
          : undefined
      }
    >
      {FILTER_ICONS[filter]}
      {filter}
    </motion.button>
  )

  return (
    <div className="sticky top-0 z-20 pb-4">
      <div className="glass-strong rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-none">
              <span className="text-gradient">What are we playing?</span>
            </h1>
            <p className="text-[11px] text-white/30 mt-1 uppercase tracking-widest font-medium">
              {gameCount} {gameCount === 1 ? 'game' : 'games'} in the pool
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Secondary actions */}
            <div className="flex items-center gap-1.5">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRefreshAll}
                disabled={gameCount === 0 || isRefreshing}
                className="glass glass-hover rounded-lg p-2 text-white/60 hover:text-white transition-colors disabled:opacity-50"
                title="Refresh all games"
              >
                <HiRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onImport}
                className="glass glass-hover rounded-lg p-2 text-white/60 hover:text-white transition-colors"
                title="Import games"
              >
                <HiUpload className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onShare}
                disabled={gameCount === 0}
                className="glass glass-hover rounded-lg p-2 text-white/60 hover:text-white transition-colors disabled:opacity-50"
                title="Share collection"
              >
                <HiShare className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Primary actions */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onPickForUs}
              disabled={gameCount === 0}
              className="glass glass-hover rounded-xl px-3 py-2 text-sm font-medium text-white/70 hover:text-white flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <HiSparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Pick For Us</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddGame}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
              }}
            >
              <HiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Game</span>
            </motion.button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            ref={ref}
            type="text"
            placeholder="Search games... (press / to focus)"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            >
              <HiX className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters section */}
        <div className="space-y-3">
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
          </div>

          {/* Genre filters */}
          {genreFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-white/30 uppercase tracking-wider mr-1">
                <HiTag className="w-3 h-3 inline mr-1" />
                Genres
              </span>
              {visibleGenres.map(filter => (
                <FilterButton key={filter} filter={filter} small />
              ))}
              {hiddenGenres.length > 0 && (
                <button
                  onClick={() => setShowMoreFilters(!showMoreFilters)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium glass text-white/40 hover:text-white/70 flex items-center gap-1"
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
              <span className="text-[11px] text-white/40">
                {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''} active
              </span>
              <button
                onClick={() => activeFilters.forEach(f => onToggleFilter(f))}
                className="text-[11px] text-purple-400 hover:text-purple-300"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Toolbar row */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/[0.04]">
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
                    className={`px-2.5 py-1.5 text-[10px] font-medium transition-all ${
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
              <span className="px-2 text-[10px] text-white/30">Group:</span>
              {(['none', 'genre', 'price'] as const).map((group) => (
                <button
                  key={group}
                  onClick={() => onGroupByChange(group)}
                  className={`px-2 py-1.5 text-[10px] font-medium transition-all ${
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
  )
})

export default FilterBar
