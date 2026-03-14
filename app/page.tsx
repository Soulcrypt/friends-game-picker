'use client'

import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { arrayMove } from '@dnd-kit/sortable'
import { DragEndEvent } from '@dnd-kit/core'
import FilterBar from './components/FilterBar'
import CompareModal from './components/CompareModal'
import AddGameModal from './components/AddGameModal'
import ImportModal from './components/ImportModal'
import TrailerModal from './components/TrailerModal'
import RecentlyAddedRow from './components/RecentlyAddedRow'
import PickerModal from './components/PickerModal'
import FloatingActionButton from './components/FloatingActionButton'
import LoginButton from './components/LoginButton'
import ErrorBoundary from './components/ErrorBoundary'
import GridView from './components/views/GridView'
import GroupedGridView from './components/views/GroupedGridView'
import ListView from './components/views/ListView'
import { GameProvider, useGameContext } from '@/lib/game-context'
import { useAuth } from '@/lib/auth-context'
import { useKeyboardNavigation, useGridColumns } from '@/lib/hooks/useKeyboardNavigation'
import type { Game } from '@/lib/types'
import { HiPlus, HiOutlineCollection, HiAdjustments, HiX, HiShare, HiStar } from 'react-icons/hi'
import { FaGamepad } from 'react-icons/fa'


function HomeContent() {
  const {
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
    handlePollRankSelect,
    getGamePollRank,
    getGamePollPoints,
    handlePollStateChange,
    isMobile,
    searchInputRef,
  } = useGameContext()

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showPickerModal, setShowPickerModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [trailerGame, setTrailerGame] = useState<Game | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)

  // Keyboard navigation
  const gridColumns = useGridColumns(cardSize)
  const anyModalOpen = showAddModal || showImportModal || showPickerModal || showCompareModal || !!trailerGame

  const { focusedId, resetFocus } = useKeyboardNavigation({
    items: filteredGames,
    gridColumns: viewMode === 'grid' ? gridColumns : 1,
    enabled: !anyModalOpen && !loading,
    searchInputRef,
    onSelect: (id) => {
      // Find game and flip card / show details
      const game = filteredGames.find(g => g.id === id)
      if (game) {
        setSelectedGameId(id)
        // For list view, we could open a details modal
        // For grid view, the card handles its own flip state
      }
    },
    onEscape: () => {
      // Close any open modal
      if (trailerGame) setTrailerGame(null)
      else if (showPickerModal) setShowPickerModal(false)
      else if (showImportModal) setShowImportModal(false)
      else if (showAddModal) setShowAddModal(false)
      else if (showCompareModal) setShowCompareModal(false)
    },
  })

  // Keyboard shortcuts for opening modals
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      // Don't trigger when typing in input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (anyModalOpen) return

      switch (e.key.toLowerCase()) {
        case 'a':
        case 'n':
          e.preventDefault()
          setShowAddModal(true)
          break
        case 'p':
          if (games.length > 0) {
            e.preventDefault()
            setShowPickerModal(true)
          }
          break
        case 'i':
          e.preventDefault()
          setShowImportModal(true)
          break
      }
    }

    window.addEventListener('keydown', handleShortcuts)
    return () => window.removeEventListener('keydown', handleShortcuts)
  }, [anyModalOpen, games.length])

  // Handle drag end for custom ordering
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = filteredGames.findIndex(g => g.id === active.id)
      const newIndex = filteredGames.findIndex(g => g.id === over.id)
      const newOrder = arrayMove(
        filteredGames.map(g => g.id),
        oldIndex,
        newIndex
      )
      setCustomOrder(newOrder)
    }
  }, [filteredGames, setCustomOrder])

  // Share collection
  async function handleShare() {
    const gameTitles = games.map(g => g.title)
    const encoded = btoa(JSON.stringify(gameTitles))
    const url = `${window.location.origin}?share=${encoded}`

    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
  }

  // Handle recent game click
  function handleRecentGameClick(game: Game) {
    if (game.trailer_url) {
      setTrailerGame(game)
    }
  }

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen px-4 sm:px-6 lg:px-8 pb-12 max-w-[2000px] mx-auto relative z-10">
        <div className="pt-6 sm:pt-8">
          {/* Skeleton header */}
          <div className="bg-surface-raised border border-border rounded-2xl p-6 mb-8">
            <div className="h-9 w-72 rounded-xl bg-surface-hover animate-pulse mb-5" />
            <div className="h-12 w-full rounded-xl bg-surface-hover animate-pulse mb-5" />
            <div className="flex gap-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-20 rounded-xl bg-surface-hover animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>

          {/* Skeleton cards — matches exact card structure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 sm:gap-8">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: 'rgb(23,30,42)',
                  border: '1px solid rgba(191,95,255,0.12)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                {/* Cover area */}
                <div className="aspect-video relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="absolute inset-0 animate-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
                  {/* Bottom gradient like real card */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                    <div className="flex gap-2">
                      <div className="h-5 w-14 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.08)', animationDelay: `${i * 0.1 + 0.1}s` }} />
                      <div className="h-5 w-10 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.06)', animationDelay: `${i * 0.1 + 0.15}s` }} />
                    </div>
                    <div className="h-5 w-2/3 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.1)', animationDelay: `${i * 0.1 + 0.2}s` }} />
                  </div>
                </div>
                {/* Bottom section */}
                <div className="p-4 space-y-3">
                  <div className="flex gap-1.5">
                    <div className="h-6 w-16 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.06)', animationDelay: `${i * 0.1 + 0.25}s` }} />
                    <div className="h-6 w-12 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', animationDelay: `${i * 0.1 + 0.3}s` }} />
                    <div className="h-6 w-20 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', animationDelay: `${i * 0.1 + 0.35}s` }} />
                  </div>
                  <div className="h-10 w-full rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.05)', animationDelay: `${i * 0.1 + 0.4}s` }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  // Top-voted game (for header chip)
  const topVotedGame = games.filter(g => g.votes > 0).sort((a, b) => b.votes - a.votes)[0] ?? null

  return (
    <main className="min-h-screen pb-12 relative z-10">
      {/* Sticky glass header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Left: icon + title + count */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 blur-lg opacity-60" style={{ background: 'hsl(var(--primary))' }} />
              <div
                className="relative w-9 h-9 flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'hsl(var(--surface-2))',
                  border: '1px solid hsl(var(--primary) / 0.5)',
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                  boxShadow: '0 0 16px hsl(var(--primary) / 0.3)',
                }}
              >
                <FaGamepad className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-xl leading-tight tracking-wide">
                <span className="text-white">WHAT ARE WE </span>
                <span className="neon-text">PLAYING?</span>
              </h1>
              <p className="font-mono text-[10px] tracking-widest" style={{ color: 'hsl(var(--primary) / 0.6)' }}>
                {'// '}{games.length} {games.length === 1 ? 'game' : 'games'} cast
              </p>
            </div>
          </div>

          {/* Right: top-voted chip + share + login */}
          <div className="flex items-center gap-2 shrink-0">
            {topVotedGame && (
              <div
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold max-w-[180px]"
                style={{
                  color: 'hsl(40 90% 60%)',
                  background: 'hsl(40 90% 60% / 0.08)',
                  border: '1px solid hsl(40 90% 60% / 0.3)',
                  borderRadius: '2px',
                  boxShadow: '0 0 12px hsl(40 90% 60% / 0.1)',
                }}
              >
                <HiStar className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate tracking-wide uppercase">{topVotedGame.title}</span>
              </div>
            )}
            <button
              onClick={handleShare}
              disabled={games.length === 0}
              className="hidden sm:flex items-center gap-2 px-4 py-2 font-display font-bold text-sm tracking-widest uppercase transition-all duration-200 disabled:opacity-40"
              style={{
                background: 'transparent',
                color: 'hsl(var(--primary))',
                border: '1.5px solid hsl(var(--primary) / 0.6)',
                borderRadius: '2px',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
              }}
              onMouseEnter={(e) => { const b = e.currentTarget; b.style.boxShadow = 'var(--shadow-button)'; b.style.background = 'hsl(var(--primary) / 0.1)' }}
              onMouseLeave={(e) => { const b = e.currentTarget; b.style.boxShadow = ''; b.style.background = 'transparent' }}
            >
              <HiShare className="w-3.5 h-3.5" />
              <span>SHARE</span>
            </button>
            <LoginButton />
          </div>
        </div>
      </header>

      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <FilterBar
          ref={searchInputRef}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          activeFilters={activeFilters}
          onToggleFilter={toggleFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onAddGame={() => setShowAddModal(true)}
          onImport={() => setShowImportModal(true)}
          onPickForUs={() => setShowPickerModal(true)}
          onRefreshAll={handleRefreshAll}
          onShare={handleShare}
          isRefreshing={isRefreshingAll}
          gameCount={games.length}
          availableFilters={availableFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          cardSize={cardSize}
          onCardSizeChange={setCardSize}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          filterPresets={filterPresets}
          onSavePreset={saveFilterPreset}
          onLoadPreset={loadFilterPreset}
          onDeletePreset={deleteFilterPreset}
          activeSourceFilters={activeSourceFilters}
          onToggleSourceFilter={toggleSourceFilter}
          availableSources={availableSources}
          games={games}
          onPollStateChange={handlePollStateChange}
        />

        {/* Recently Added Row */}
        {recentlyAddedGames.length > 0 && (
          <RecentlyAddedRow
            games={recentlyAddedGames}
            onGameClick={handleRecentGameClick}
          />
        )}

        {/* Empty states */}
        {games.length === 0 ? (
          <EmptyCollectionState onAddGame={() => setShowAddModal(true)} />
        ) : filteredGames.length === 0 ? (
          <NoMatchesState onClearFilters={clearFilters} />
        ) : viewMode === 'grid' && groupBy !== 'none' && groupedGames ? (
          <GroupedGridView
            groupedGames={groupedGames}
            votedGames={votedGames}
            pinnedGames={pinnedGames}
            collapsedGroups={collapsedGroups}
            cardSize={cardSize}
            isPollActive={!!activePoll}
            userPollRanks={userPollRankings}
            onVote={handleVote}
            onRemove={handleRemove}
            onPin={togglePin}
            onPlayTrailer={setTrailerGame}
            onPollRankSelect={handlePollRankSelect}
            onToggleGroup={toggleGroupCollapse}
            getGamePollRank={getGamePollRank}
            getGamePollPoints={getGamePollPoints}
          />
        ) : viewMode === 'grid' ? (
          <GridView
            games={filteredGames}
            votedGames={votedGames}
            pinnedGames={pinnedGames}
            cardSize={cardSize}
            sortBy={sortBy}
            groupBy={groupBy}
            searchTerm={searchTerm}
            isPollActive={!!activePoll}
            userPollRanks={userPollRankings}
            onVote={handleVote}
            onRemove={handleRemove}
            onPin={togglePin}
            onPlayTrailer={setTrailerGame}
            onPollRankSelect={handlePollRankSelect}
            onDragEnd={handleDragEnd}
            getGamePollRank={getGamePollRank}
            getGamePollPoints={getGamePollPoints}
          />
        ) : viewMode === 'list' ? (
          <ListView
            games={filteredGames}
            votedGames={votedGames}
            onVote={handleVote}
            onRemove={handleRemove}
            onPlayTrailer={setTrailerGame}
            onCardClick={() => {}}
          />
        ) : (
          <ListView
            games={filteredGames}
            votedGames={votedGames}
            compact
            onVote={handleVote}
            onRemove={handleRemove}
            onPlayTrailer={setTrailerGame}
            onCardClick={() => {}}
          />
        )}
      </div>

      {/* Modals */}
      <AddGameModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onGameAdded={handleGameAdded}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={handleImported}
      />

      <TrailerModal
        isOpen={!!trailerGame}
        onClose={() => setTrailerGame(null)}
        trailerUrl={trailerGame?.trailer_url || ''}
        gameTitle={trailerGame?.title || ''}
      />

      <PickerModal
        isOpen={showPickerModal}
        onClose={() => setShowPickerModal(false)}
        games={filteredGames}
      />

      <CompareModal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        games={games.filter(g => compareGames.includes(g.id))}
        onRemoveGame={(gameId) => toggleCompare(gameId)}
        onVote={handleVote}
        votedGames={votedGames}
      />

      {/* Floating compare button */}
      <AnimatePresence>
        {compareGames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 sm:bottom-6 right-6 z-40 flex items-center gap-3 max-sm:bottom-24"
          >
            <button
              onClick={clearCompare}
              className="rounded-full p-3 text-text-tertiary hover:text-text-primary transition-all duration-150 min-h-[48px] min-w-[48px] flex items-center justify-center shadow-lg"
              style={{ background: 'rgba(22,26,35,0.92)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(16px)' }}
              title="Clear selection"
              aria-label="Clear game selection"
            >
              <HiX className="w-5 h-5" />
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCompareModal(true)}
              disabled={compareGames.length < 2}
              className="rounded-xl px-6 py-3.5 text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] transition-all duration-150"
              style={{
                background: 'rgb(191,95,255)',
                boxShadow: '0 0 20px rgba(191,95,255,0.5)',
                color: '#000',
                fontFamily: 'var(--font-space-mono), Space Mono, monospace',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
              aria-label={`Compare ${compareGames.length} selected games`}
            >
              Compare ({compareGames.length}/3)
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Floating Action Button */}
      <FloatingActionButton
        onAddGame={() => setShowAddModal(true)}
        onPickForUs={() => setShowPickerModal(true)}
        onImport={() => setShowImportModal(true)}
        onShare={handleShare}
        gameCount={games.length}
      />
    </main>
  )
}

// Empty collection state component
function EmptyCollectionState({ onAddGame }: { onAddGame: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-32 text-center"
    >
      {/* Icon container with subtle glow */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative mb-10"
      >
        <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-2xl scale-150" />
        <div className="relative w-28 h-28 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <HiOutlineCollection className="w-14 h-14 text-primary/50" />
        </div>
      </motion.div>

      <h2 className="text-2xl font-semibold text-text-primary mb-3" style={{ letterSpacing: '-0.015em' }}>
        Your collection is empty
      </h2>
      <p className="text-base text-text-secondary mb-10 max-w-md leading-relaxed">
        Add some games to start voting with your friends. Search for any game and it will automatically fetch cover art and details.
      </p>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onAddGame}
        className="btn-primary rounded-xl px-8 py-4 text-base flex items-center gap-2.5 transition-all duration-150"
      >
        <HiPlus className="w-5 h-5" />
        Add Your First Game
      </motion.button>
    </motion.div>
  )
}

// No matches state component
function NoMatchesState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-32 text-center"
    >
      {/* Icon container */}
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative mb-10"
      >
        <div className="absolute inset-0 bg-amber-500/15 rounded-3xl blur-2xl scale-150" />
        <div className="relative w-28 h-28 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.15)' }}>
          <HiAdjustments className="w-14 h-14 text-amber-400/50" />
        </div>
      </motion.div>

      <h2 className="text-2xl font-semibold text-text-primary mb-3">
        No games match your filters
      </h2>
      <p className="text-base text-text-tertiary mb-10 max-w-md leading-relaxed">
        Try adjusting your search term or removing some filters to see more games.
      </p>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClearFilters}
        className="rounded-xl px-8 py-4 text-base font-medium text-text-secondary hover:text-text-primary flex items-center gap-2 transition-all duration-150"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        Clear All Filters
      </motion.button>
    </motion.div>
  )
}

// Main Home component with provider
export default function Home() {
  const { profile } = useAuth()

  return (
    <ErrorBoundary>
      <GameProvider userId={profile?.id}>
        <HomeContent />
      </GameProvider>
    </ErrorBoundary>
  )
}
