'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import GameCard from './components/GameCard'
import SortableGameCard from './components/SortableGameCard'
import GameListItem from './components/GameListItem'
import FilterBar from './components/FilterBar'
import CompareModal from './components/CompareModal'
import AddGameModal from './components/AddGameModal'
import ImportModal from './components/ImportModal'
import TrailerModal from './components/TrailerModal'
import RecentlyAddedRow from './components/RecentlyAddedRow'
import PickerModal from './components/PickerModal'
import { getGames, voteForGame, getSessionId, getUserVotes, removeGame, restoreGame, updateGameCover } from '@/lib/votes'
import { fetchSteamCoverByTitle } from '@/lib/steam'
import type { Game, ViewMode, CardSize, FilterPreset } from '@/lib/types'
import toast from 'react-hot-toast'
import { HiPlus, HiOutlineCollection, HiAdjustments, HiChevronDown, HiChevronRight, HiX } from 'react-icons/hi'

export default function Home() {
  const [games, setGames] = useState<Game[]>([])
  const [filteredGames, setFilteredGames] = useState<Game[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'votes' | 'title'>('votes')
  const [loading, setLoading] = useState(true)
  const [votedGames, setVotedGames] = useState<string[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showPickerModal, setShowPickerModal] = useState(false)
  const [trailerGame, setTrailerGame] = useState<Game | null>(null)
  const [isRefreshingAll, setIsRefreshingAll] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [cardSize, setCardSize] = useState<CardSize>('medium')
  const [pinnedGames, setPinnedGames] = useState<string[]>([])
  const [groupBy, setGroupBy] = useState<'none' | 'genre' | 'price'>('none')
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([])
  const [compareGames, setCompareGames] = useState<string[]>([])
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [customOrder, setCustomOrder] = useState<string[]>([])
  const [isDragMode, setIsDragMode] = useState(false)
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([])

  // Load filter presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('filterPresets')
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
    localStorage.setItem('filterPresets', JSON.stringify(filterPresets))
  }, [filterPresets])

  function saveFilterPreset(name: string) {
    const preset: FilterPreset = {
      id: Date.now().toString(),
      name,
      filters: activeFilters,
      sortBy,
    }
    setFilterPresets(prev => [...prev, preset])
    toast.success(`Preset "${name}" saved!`)
  }

  function loadFilterPreset(preset: FilterPreset) {
    setActiveFilters(preset.filters)
    setSortBy(preset.sortBy)
    toast.success(`Loaded "${preset.name}"`)
  }

  function deleteFilterPreset(presetId: string) {
    setFilterPresets(prev => prev.filter(p => p.id !== presetId))
    toast.success('Preset deleted')
  }

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
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
  }

  function toggleCompare(gameId: string) {
    setCompareGames(prev => {
      if (prev.includes(gameId)) {
        return prev.filter(id => id !== gameId)
      } else if (prev.length < 3) {
        return [...prev, gameId]
      }
      return prev
    })
  }

  function removeFromCompare(gameId: string) {
    setCompareGames(prev => prev.filter(id => id !== gameId))
  }
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load pinned games from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pinnedGames')
    if (saved) {
      try {
        setPinnedGames(JSON.parse(saved))
      } catch {
        // ignore
      }
    }
  }, [])

  // Save pinned games to localStorage
  useEffect(() => {
    localStorage.setItem('pinnedGames', JSON.stringify(pinnedGames))
  }, [pinnedGames])

  function togglePin(gameId: string) {
    setPinnedGames(prev =>
      prev.includes(gameId)
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    )
  }

  async function handleShare() {
    // Create a shareable URL with game titles encoded
    const gameTitles = games.map(g => g.title)
    const encoded = btoa(JSON.stringify(gameTitles))
    const url = `${window.location.origin}?share=${encoded}`

    try {
      await navigator.clipboard.writeText(url)
      toast.success('Share link copied to clipboard!')
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      toast.success('Share link copied!')
    }
  }

  function toggleGroupCollapse(groupName: string) {
    setCollapsedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    )
  }

  // Group games by selected criteria
  const groupedGames = useMemo(() => {
    if (groupBy === 'none') return null

    const groups: Record<string, Game[]> = {}

    filteredGames.forEach(game => {
      let key: string

      if (groupBy === 'genre') {
        // Use first tag as primary genre
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

    // Sort groups by name (with some logical ordering for price)
    const sortOrder = groupBy === 'price'
      ? ['Free to Play', 'Under $10', '$10 - $30', '$30 - $60', '$60+', 'Other']
      : null

    return Object.entries(groups).sort((a, b) => {
      if (sortOrder) {
        return sortOrder.indexOf(a[0]) - sortOrder.indexOf(b[0])
      }
      return a[0].localeCompare(b[0])
    })
  }, [filteredGames, groupBy])

  useEffect(() => {
    loadGames()
    loadUserVotes()
  }, [])

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      // Allow Escape to blur input
      if (e.key === 'Escape') {
        target.blur()
      }
      return
    }

    // Don't trigger when modals are open (except Escape)
    const anyModalOpen = showAddModal || showImportModal || showPickerModal || trailerGame

    if (e.key === 'Escape') {
      if (trailerGame) setTrailerGame(null)
      else if (showPickerModal) setShowPickerModal(false)
      else if (showImportModal) setShowImportModal(false)
      else if (showAddModal) setShowAddModal(false)
      return
    }

    if (anyModalOpen) return

    // Shortcuts when no modal is open
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
      case '/':
        e.preventDefault()
        searchInputRef.current?.focus()
        break
    }

    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      searchInputRef.current?.focus()
    }
  }, [showAddModal, showImportModal, showPickerModal, trailerGame, games.length])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    filterAndSortGames()
  }, [games, searchTerm, activeFilters, sortBy, pinnedGames, customOrder])

  // Compute available filters from games (tags + categories)
  const availableFilters = useMemo(() => {
    const filterSet = new Set<string>()

    // Always include Free/Paid
    filterSet.add('Free')
    filterSet.add('Paid')

    games.forEach(game => {
      // Add genre tags
      game.tags.forEach(tag => filterSet.add(tag))

      // Add multiplayer categories (simplified names)
      game.categories?.forEach(cat => {
        if (cat.includes('Multi-player') || cat === 'Multi-player') filterSet.add('Multiplayer')
        if (cat.includes('Co-op')) filterSet.add('Co-op')
        if (cat === 'Single-player') filterSet.add('Single-player')
        if (cat.includes('PvP')) filterSet.add('PvP')
      })
    })

    return Array.from(filterSet)
  }, [games])

  // Recently added games (last 7 days)
  const recentlyAddedGames = useMemo(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    return games
      .filter(game => {
        if (!game.created_at) return false
        return new Date(game.created_at) >= sevenDaysAgo
      })
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      })
      .slice(0, 5)
  }, [games])

  async function loadGames() {
    try {
      const data = await getGames()
      setGames(data)
      enrichCovers(data)
    } catch (error) {
      console.error('Error loading games:', error)
    } finally {
      setLoading(false)
    }
  }

  async function enrichCovers(loadedGames: Game[]) {
    const needsEnrich = loadedGames.filter(
      g => !g.cover || g.cover.startsWith('/covers/')
    )
    if (needsEnrich.length === 0) return

    // Fetch all Steam data in parallel (much faster!)
    const steamDataResults = await Promise.all(
      needsEnrich.map(game =>
        fetchSteamCoverByTitle(game.title).catch(() => null)
      )
    )

    // Process results and update games
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

      // Update DB in background (don't await)
      updateGameCover(
        game.id,
        steamData.cover,
        steamData.steam_appid,
        steamData.metacritic ?? undefined,
        steamData.trailer_url
      )
    }

    // Batch update UI state once
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

  function filterAndSortGames() {
    let filtered = [...games]

    if (searchTerm) {
      filtered = filtered.filter(game =>
        game.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (activeFilters.length > 0) {
      filtered = filtered.filter(game =>
        activeFilters.every(filter => {
          // Price filters
          if (filter === 'Free') return game.price === 'Free'
          if (filter === 'Paid') return game.price !== 'Free' && game.price !== 'TBD'

          // Category/multiplayer filters
          if (filter === 'Multiplayer') {
            return game.categories?.some(c => c.includes('Multi-player'))
          }
          if (filter === 'Co-op') {
            return game.categories?.some(c => c.includes('Co-op'))
          }
          if (filter === 'Single-player') {
            return game.categories?.some(c => c === 'Single-player')
          }
          if (filter === 'PvP') {
            return game.categories?.some(c => c.includes('PvP'))
          }

          // Genre tags
          return game.tags.includes(filter)
        })
      )
    }

    // Sort: custom order first, then pinned, then by selected sort
    filtered.sort((a, b) => {
      // If we have a custom order from drag & drop, use it
      if (customOrder.length > 0) {
        const aIndex = customOrder.indexOf(a.id)
        const bIndex = customOrder.indexOf(b.id)
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
      }

      const aPinned = pinnedGames.includes(a.id)
      const bPinned = pinnedGames.includes(b.id)

      // Pinned games come first
      if (aPinned && !bPinned) return -1
      if (!aPinned && bPinned) return 1

      // Then sort by selected method
      if (sortBy === 'votes') {
        return b.votes - a.votes
      } else {
        return a.title.localeCompare(b.title)
      }
    })

    setFilteredGames(filtered)
  }

  async function handleVote(gameId: string) {
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
    }
  }

  async function handleRemove(gameId: string, title: string) {
    // Find the game to store for potential restore
    const gameToRemove = games.find(g => g.id === gameId)
    if (!gameToRemove) return

    // Optimistically remove from UI
    setGames(prev => prev.filter(g => g.id !== gameId))
    setVotedGames(prev => prev.filter(id => id !== gameId))

    // Track if undo was clicked
    let undoClicked = false

    // Show toast with undo option
    toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span>{title} removed</span>
          <button
            onClick={async () => {
              undoClicked = true
              toast.dismiss(t.id)

              // Restore to UI immediately
              setGames(prev => [...prev, gameToRemove])

              // Restore in database
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
      {
        duration: 5000,
        icon: '🗑️',
      }
    )

    // Wait for toast to finish, then delete from DB if not undone
    setTimeout(async () => {
      if (!undoClicked) {
        const success = await removeGame(gameId)
        if (!success) {
          // Restore if delete failed
          setGames(prev => [...prev, gameToRemove])
          toast.error('Failed to remove game')
        }
      }
    }, 5500)
  }

  async function handleRefresh(gameId: string) {
    const game = games.find(g => g.id === gameId)
    if (!game) return

    toast.loading('Refreshing game data...', { id: 'refresh' })

    try {
      const steamData = await fetchSteamCoverByTitle(game.title)
      if (!steamData) {
        toast.error('Could not fetch game data', { id: 'refresh' })
        return
      }

      // Update DB
      await updateGameCover(
        game.id,
        steamData.cover,
        steamData.steam_appid,
        steamData.metacritic ?? undefined,
        steamData.trailer_url
      )

      // Update local state
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
  }

  async function handleRefreshAll() {
    if (games.length === 0 || isRefreshingAll) return

    setIsRefreshingAll(true)
    toast.loading(`Refreshing ${games.length} games...`, { id: 'refresh-all' })

    try {
      // Fetch all Steam data in parallel
      const steamDataResults = await Promise.all(
        games.map(game =>
          fetchSteamCoverByTitle(game.title).catch(() => null)
        )
      )

      // Process results and update games
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

          // Update DB in background
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
  }

  function handleGameAdded(game: Game) {
    setGames(prev => [...prev, game])
  }

  function handleImported() {
    loadGames()
  }

  function toggleFilter(filter: string) {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }

  function clearFilters() {
    setActiveFilters([])
    setSearchTerm('')
  }

  function handleRecentGameClick(game: Game) {
    if (game.trailer_url) {
      setTrailerGame(game)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto">
        <div className="pt-4">
          {/* Skeleton header */}
          <div className="glass-strong rounded-2xl p-5 mb-6">
            <div className="h-8 w-64 rounded-lg bg-gradient-to-r from-white/[0.03] via-white/[0.06] to-white/[0.03] bg-[length:200%_100%] animate-shimmer mb-4" />
            <div className="h-10 w-full rounded-xl bg-gradient-to-r from-white/[0.03] via-white/[0.06] to-white/[0.03] bg-[length:200%_100%] animate-shimmer mb-4" />
            <div className="flex gap-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-16 rounded-full bg-gradient-to-r from-white/[0.03] via-white/[0.06] to-white/[0.03] bg-[length:200%_100%] animate-shimmer"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>

          {/* Skeleton cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl overflow-hidden"
              >
                <div className="aspect-[460/215] bg-gradient-to-r from-white/[0.02] via-white/[0.05] to-white/[0.02] bg-[length:200%_100%] animate-shimmer" />
                <div className="p-3.5 space-y-2.5">
                  <div className="flex gap-1">
                    <div className="h-5 w-14 rounded-md bg-gradient-to-r from-white/[0.02] via-white/[0.05] to-white/[0.02] bg-[length:200%_100%] animate-shimmer" />
                    <div className="h-5 w-14 rounded-md bg-gradient-to-r from-white/[0.02] via-white/[0.05] to-white/[0.02] bg-[length:200%_100%] animate-shimmer" />
                  </div>
                  <div className="h-8 w-full rounded-lg bg-gradient-to-r from-white/[0.02] via-white/[0.05] to-white/[0.02] bg-[length:200%_100%] animate-shimmer" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="pt-4">
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
        />

        {/* Recently Added Row */}
        {recentlyAddedGames.length > 0 && (
          <RecentlyAddedRow
            games={recentlyAddedGames}
            onGameClick={handleRecentGameClick}
          />
        )}

        {games.length === 0 ? (
          // Empty collection state
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-2xl glass flex items-center justify-center mb-8"
            >
              <HiOutlineCollection className="w-12 h-12 text-white/20" />
            </motion.div>
            <h2 className="text-xl font-semibold text-white/70 mb-3">
              Your collection is empty
            </h2>
            <p className="text-sm text-white/40 mb-8 max-w-sm leading-relaxed">
              Add some games to start voting with your friends. Search for any game and it will automatically fetch cover art and details.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="rounded-xl px-6 py-3 text-sm font-medium text-white flex items-center gap-2 transition-all"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
              }}
            >
              <HiPlus className="w-5 h-5" />
              Add Your First Game
            </motion.button>
          </motion.div>
        ) : filteredGames.length === 0 ? (
          // No filter matches state
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-2xl glass flex items-center justify-center mb-8"
            >
              <HiAdjustments className="w-12 h-12 text-white/20" />
            </motion.div>
            <h2 className="text-xl font-semibold text-white/70 mb-3">
              No games match your filters
            </h2>
            <p className="text-sm text-white/40 mb-8 max-w-sm leading-relaxed">
              Try adjusting your search term or removing some filters to see more games.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearFilters}
              className="glass glass-hover rounded-xl px-6 py-3 text-sm font-medium text-white/70 hover:text-white flex items-center gap-2 transition-all"
            >
              Clear All Filters
            </motion.button>
          </motion.div>
        ) : viewMode === 'grid' && groupBy !== 'none' && groupedGames ? (
          // Grouped grid view
          <div className="space-y-6">
            {groupedGames.map(([groupName, groupGames]) => (
              <div key={groupName}>
                <button
                  onClick={() => toggleGroupCollapse(groupName)}
                  className="flex items-center gap-2 mb-3 text-white/80 hover:text-white transition-colors group"
                >
                  {collapsedGroups.includes(groupName) ? (
                    <HiChevronRight className="w-5 h-5" />
                  ) : (
                    <HiChevronDown className="w-5 h-5" />
                  )}
                  <h3 className="text-lg font-semibold">{groupName}</h3>
                  <span className="text-sm text-white/40 group-hover:text-white/60">
                    ({groupGames.length})
                  </span>
                </button>
                {!collapsedGroups.includes(groupName) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`grid gap-3 sm:gap-4 lg:gap-5 ${
                      cardSize === 'small'
                        ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
                        : cardSize === 'large'
                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
                        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    }`}
                  >
                    <AnimatePresence mode="popLayout">
                      {groupGames.map((game, index) => (
                        <GameCard
                          key={game.id}
                          game={game}
                          onVote={() => handleVote(game.id)}
                          onRemove={() => handleRemove(game.id, game.title)}
                          onPlayTrailer={() => setTrailerGame(game)}
                          onRefresh={handleRefresh}
                          onPin={() => togglePin(game.id)}
                          rank={index + 1}
                          index={index}
                          hasVoted={votedGames.includes(game.id)}
                          isPinned={pinnedGames.includes(game.id)}
                          size={cardSize}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredGames.map(g => g.id)}
              strategy={rectSortingStrategy}
            >
              <div className={`grid gap-3 sm:gap-4 lg:gap-5 ${
                cardSize === 'small'
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
                  : cardSize === 'large'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}>
                <AnimatePresence mode="popLayout">
                  {filteredGames.map((game, index) => (
                    <SortableGameCard
                      key={game.id}
                      game={game}
                      onVote={() => handleVote(game.id)}
                      onRemove={() => handleRemove(game.id, game.title)}
                      onPlayTrailer={() => setTrailerGame(game)}
                      onRefresh={handleRefresh}
                      onPin={() => togglePin(game.id)}
                      onCompare={() => toggleCompare(game.id)}
                      rank={index + 1}
                      index={index}
                      hasVoted={votedGames.includes(game.id)}
                      isPinned={pinnedGames.includes(game.id)}
                      isComparing={compareGames.includes(game.id)}
                      size={cardSize}
                      isDraggable={sortBy === 'votes' && groupBy === 'none'}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredGames.map((game, index) => (
                <GameListItem
                  key={game.id}
                  game={game}
                  onVote={() => handleVote(game.id)}
                  onRemove={() => handleRemove(game.id, game.title)}
                  onPlayTrailer={() => setTrailerGame(game)}
                  onCardClick={() => {/* Could open details modal */}}
                  rank={index + 1}
                  index={index}
                  hasVoted={votedGames.includes(game.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {filteredGames.map((game, index) => (
                <GameListItem
                  key={game.id}
                  game={game}
                  onVote={() => handleVote(game.id)}
                  onRemove={() => handleRemove(game.id, game.title)}
                  onPlayTrailer={() => setTrailerGame(game)}
                  onCardClick={() => {/* Could open details modal */}}
                  rank={index + 1}
                  index={index}
                  hasVoted={votedGames.includes(game.id)}
                  compact
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

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
        onRemoveGame={removeFromCompare}
        onVote={handleVote}
        votedGames={votedGames}
      />

      {/* Floating compare button */}
      <AnimatePresence>
        {compareGames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-3"
          >
            <button
              onClick={() => setCompareGames([])}
              className="glass glass-hover rounded-full p-3 text-white/60 hover:text-white transition-colors"
              title="Clear selection"
            >
              <HiX className="w-5 h-5" />
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCompareModal(true)}
              disabled={compareGames.length < 2}
              className="rounded-xl px-5 py-3 text-sm font-medium text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
              }}
            >
              Compare ({compareGames.length}/3)
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
