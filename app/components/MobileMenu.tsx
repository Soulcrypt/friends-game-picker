'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiX,
  HiViewGrid,
  HiViewList,
  HiRefresh,
  HiUpload,
  HiShare,
  HiSparkles,
  HiSortDescending,
  HiSortAscending,
  HiTag,
  HiCurrencyDollar,
  HiUsers,
} from 'react-icons/hi'
import { FaGamepad } from 'react-icons/fa'
import type { ViewMode, CardSize, FilterPreset } from '@/lib/types'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  // View controls
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  cardSize: CardSize
  onCardSizeChange: (size: CardSize) => void
  sortBy: 'votes' | 'title'
  onSortChange: (sort: 'votes' | 'title') => void
  groupBy: 'none' | 'genre' | 'price'
  onGroupByChange: (group: 'none' | 'genre' | 'price') => void
  // Actions
  onRefreshAll: () => void
  onImport: () => void
  onShare: () => void
  onPickForUs: () => void
  isRefreshing: boolean
  gameCount: number
  // Filters
  activeFilters: string[]
  onToggleFilter: (filter: string) => void
  availableFilters: string[]
  // Presets
  filterPresets: FilterPreset[]
  onSavePreset: (name: string) => void
  onLoadPreset: (preset: FilterPreset) => void
  onDeletePreset: (presetId: string) => void
}

const PLAYER_MODE_FILTERS = ['Single-player', 'Multiplayer', 'Co-op', 'PvP']
const PRICE_FILTERS = ['Free', 'Paid']

const FILTER_ICONS: Record<string, JSX.Element> = {
  'Multiplayer': <HiUsers className="w-3.5 h-3.5" />,
  'Co-op': <HiUsers className="w-3.5 h-3.5" />,
  'Single-player': <FaGamepad className="w-3.5 h-3.5" />,
  'PvP': <HiUsers className="w-3.5 h-3.5" />,
  'Free': <HiCurrencyDollar className="w-3.5 h-3.5" />,
  'Paid': <HiCurrencyDollar className="w-3.5 h-3.5" />,
}

export default function MobileMenu({
  isOpen,
  onClose,
  viewMode,
  onViewModeChange,
  cardSize,
  onCardSizeChange,
  sortBy,
  onSortChange,
  groupBy,
  onGroupByChange,
  onRefreshAll,
  onImport,
  onShare,
  onPickForUs,
  isRefreshing,
  gameCount,
  activeFilters,
  onToggleFilter,
  availableFilters,
}: MobileMenuProps) {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Organize filters
  const playerModeFilters = PLAYER_MODE_FILTERS.filter(f => availableFilters.includes(f))
  const priceFilters = PRICE_FILTERS.filter(f => availableFilters.includes(f))
  const genreFilters = availableFilters
    .filter(f => !PLAYER_MODE_FILTERS.includes(f) && !PRICE_FILTERS.includes(f))
    .sort((a, b) => a.localeCompare(b))

  const FilterChip = ({ filter }: { filter: string }) => (
    <button
      onClick={() => onToggleFilter(filter)}
      className={`rounded-full font-medium transition-all whitespace-nowrap flex items-center gap-1.5 px-3 py-2 text-sm min-h-[44px] ${
        activeFilters.includes(filter)
          ? 'text-white shadow-lg'
          : 'glass text-white/50'
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
    </button>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-hidden"
          >
            <div className="glass-strong rounded-t-3xl">
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/60 hover:text-white"
              >
                <HiX className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="px-5 pb-8 pt-2 overflow-y-auto max-h-[calc(85vh-40px)] space-y-6">
                {/* View Controls */}
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">
                    View Options
                  </h3>

                  {/* View Mode */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Layout</span>
                    <div className="flex items-center glass rounded-lg overflow-hidden">
                      <button
                        onClick={() => onViewModeChange('grid')}
                        className={`p-3 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all ${
                          viewMode === 'grid' ? 'text-white bg-white/10' : 'text-white/40'
                        }`}
                      >
                        <HiViewGrid className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onViewModeChange('list')}
                        className={`p-3 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all ${
                          viewMode === 'list' ? 'text-white bg-white/10' : 'text-white/40'
                        }`}
                      >
                        <HiViewList className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Size (grid only) */}
                  {viewMode === 'grid' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Size</span>
                      <div className="flex items-center glass rounded-lg overflow-hidden">
                        {(['small', 'medium', 'large'] as const).map((size) => (
                          <button
                            key={size}
                            onClick={() => onCardSizeChange(size)}
                            className={`px-4 py-3 min-h-[44px] text-sm font-medium transition-all ${
                              cardSize === size ? 'text-white bg-white/10' : 'text-white/40'
                            }`}
                          >
                            {size[0].toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sort */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Sort</span>
                    <div className="flex items-center glass rounded-lg overflow-hidden">
                      <button
                        onClick={() => onSortChange('votes')}
                        className={`px-4 py-3 min-h-[44px] text-sm font-medium transition-all flex items-center gap-2 ${
                          sortBy === 'votes' ? 'text-white bg-white/10' : 'text-white/40'
                        }`}
                      >
                        <HiSortDescending className="w-4 h-4" />
                        Top
                      </button>
                      <button
                        onClick={() => onSortChange('title')}
                        className={`px-4 py-3 min-h-[44px] text-sm font-medium transition-all flex items-center gap-2 ${
                          sortBy === 'title' ? 'text-white bg-white/10' : 'text-white/40'
                        }`}
                      >
                        <HiSortAscending className="w-4 h-4" />
                        A-Z
                      </button>
                    </div>
                  </div>

                  {/* Group By */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Group</span>
                    <div className="flex items-center glass rounded-lg overflow-hidden">
                      {(['none', 'genre', 'price'] as const).map((group) => (
                        <button
                          key={group}
                          onClick={() => onGroupByChange(group)}
                          className={`px-3 py-3 min-h-[44px] text-sm font-medium transition-all ${
                            groupBy === group ? 'text-white bg-white/10' : 'text-white/40'
                          }`}
                        >
                          {group === 'none' ? 'Off' : group.charAt(0).toUpperCase() + group.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/[0.06]" />

                {/* Actions */}
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">
                    Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { onRefreshAll(); onClose(); }}
                      disabled={gameCount === 0 || isRefreshing}
                      className="glass glass-hover rounded-xl p-4 min-h-[56px] text-white/70 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <HiRefresh className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span className="text-sm font-medium">Refresh</span>
                    </button>
                    <button
                      onClick={() => { onImport(); onClose(); }}
                      className="glass glass-hover rounded-xl p-4 min-h-[56px] text-white/70 hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <HiUpload className="w-5 h-5" />
                      <span className="text-sm font-medium">Import</span>
                    </button>
                    <button
                      onClick={() => { onShare(); onClose(); }}
                      disabled={gameCount === 0}
                      className="glass glass-hover rounded-xl p-4 min-h-[56px] text-white/70 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <HiShare className="w-5 h-5" />
                      <span className="text-sm font-medium">Share</span>
                    </button>
                    <button
                      onClick={() => { onPickForUs(); onClose(); }}
                      disabled={gameCount === 0}
                      className="rounded-xl p-4 min-h-[56px] text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                      }}
                    >
                      <HiSparkles className="w-5 h-5" />
                      <span className="text-sm font-medium">Pick For Us</span>
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/[0.06]" />

                {/* Filters */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">
                      Filters
                    </h3>
                    {activeFilters.length > 0 && (
                      <button
                        onClick={() => activeFilters.forEach(f => onToggleFilter(f))}
                        className="text-xs text-purple-400 hover:text-purple-300"
                      >
                        Clear all ({activeFilters.length})
                      </button>
                    )}
                  </div>

                  {/* Price & Player Mode */}
                  {(priceFilters.length > 0 || playerModeFilters.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {priceFilters.map(filter => (
                        <FilterChip key={filter} filter={filter} />
                      ))}
                      {playerModeFilters.map(filter => (
                        <FilterChip key={filter} filter={filter} />
                      ))}
                    </div>
                  )}

                  {/* Genres */}
                  {genreFilters.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/30">
                        <HiTag className="w-3.5 h-3.5" />
                        <span className="text-xs uppercase tracking-wider">Genres</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {genreFilters.map(filter => (
                          <FilterChip key={filter} filter={filter} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
