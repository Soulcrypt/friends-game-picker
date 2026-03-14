'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiSearch, HiX, HiPlus } from 'react-icons/hi'
import { FaSteam } from 'react-icons/fa'
import { SiEpicgames, SiGogdotcom } from 'react-icons/si'
import { FaXbox } from 'react-icons/fa'
import { TbWorldWww } from 'react-icons/tb'
import { searchSteamGames, getSteamAppDetails, getSteamHeaderUrl, getSteamTrailerUrl } from '@/lib/steam'
import type { SteamSearchResult } from '@/lib/steam'
import { addGame } from '@/lib/votes'
import type { Game, GameSource, UnifiedSearchResult } from '@/lib/types'
import toast from 'react-hot-toast'

interface AddGameModalProps {
  isOpen: boolean
  onClose: () => void
  onGameAdded: (game: Game) => void
}

type SourceTab = 'all' | 'steam' | 'igdb'

// Source icon component
function SourceIcon({ source, className = 'w-4 h-4' }: { source: GameSource; className?: string }) {
  switch (source) {
    case 'steam':
      return <FaSteam className={className} />
    case 'epic':
      return <SiEpicgames className={className} />
    case 'gog':
      return <SiGogdotcom className={className} />
    case 'xbox':
      return <FaXbox className={className} />
    case 'igdb':
      return <TbWorldWww className={className} />
    default:
      return <TbWorldWww className={className} />
  }
}

// Source badge colors
function getSourceColor(source: GameSource): string {
  switch (source) {
    case 'steam':
      return 'bg-[#1B2838] text-[#66C0F4]'
    case 'epic':
      return 'bg-[#2A2A2A] text-white'
    case 'gog':
      return 'bg-[#86328A] text-white'
    case 'xbox':
      return 'bg-[#107C10] text-white'
    case 'igdb':
      return 'bg-purple-900/50 text-purple-300'
    default:
      return 'bg-white/10 text-white/70'
  }
}

export default function AddGameModal({ isOpen, onClose, onGameAdded }: AddGameModalProps) {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<SourceTab>('all')
  const [results, setResults] = useState<UnifiedSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [igdbAvailable, setIgdbAvailable] = useState(true)

  // Search function that uses the unified API
  const performSearch = useCallback(async (searchQuery: string, tab: SourceTab) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)

    try {
      if (tab === 'steam') {
        // Steam-only search via existing API
        const steamResults = await searchSteamGames(searchQuery)
        const unified: UnifiedSearchResult[] = steamResults.map((r: SteamSearchResult) => ({
          id: `steam_${r.id}`,
          title: r.name,
          cover: r.tiny_image,
          source: 'steam' as GameSource,
          externalIds: { steam_appid: r.id },
          metacritic: r.metascore ? parseInt(r.metascore, 10) : undefined,
        }))
        setResults(unified)
      } else {
        // Unified search (all or igdb)
        const sources = tab === 'igdb' ? 'igdb' : 'steam,igdb'
        const response = await fetch(`/api/games/search?q=${encodeURIComponent(searchQuery)}&sources=${sources}`)

        if (response.ok) {
          const data = await response.json()
          setResults(data.items || [])
          // Check if IGDB is available
          if (data.sources && !data.sources.includes('igdb')) {
            setIgdbAvailable(false)
          }
        } else {
          // Fallback to Steam only
          const steamResults = await searchSteamGames(searchQuery)
          const unified: UnifiedSearchResult[] = steamResults.map((r: SteamSearchResult) => ({
            id: `steam_${r.id}`,
            title: r.name,
            cover: r.tiny_image,
            source: 'steam' as GameSource,
            externalIds: { steam_appid: r.id },
            metacritic: r.metascore ? parseInt(r.metascore, 10) : undefined,
          }))
          setResults(unified)
        }
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, activeTab)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, activeTab, performSearch])

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  const handleAdd = useCallback(async (game: UnifiedSearchResult) => {
    setAddingId(game.id)

    try {
      let cover = game.cover
      let tags = game.genres || []
      let price = game.price || 'TBD'
      let trailerUrl: string | undefined
      let metacritic = game.metacritic
      let screenshots: string[] | undefined
      let description: string | undefined
      let platforms = game.platforms

      // If we have a Steam App ID, fetch full details from Steam
      if (game.externalIds.steam_appid) {
        const details = await getSteamAppDetails(game.externalIds.steam_appid)
        if (details) {
          cover = details.header_image || cover
          tags = details.genres?.map(g => g.description).slice(0, 3) || tags
          metacritic = details.metacritic?.score ?? metacritic
          description = details.short_description

          if (details.is_free) {
            price = 'Free'
          } else if (details.price_overview) {
            price = details.price_overview.final_formatted
          }

          if (details.movies?.length) {
            trailerUrl = getSteamTrailerUrl(details.movies[0].id)
          }
        }
      }
      // For non-Steam games, fetch details from IGDB
      else if (game.externalIds.igdb_id) {
        try {
          const response = await fetch(`/api/igdb/details?id=${game.externalIds.igdb_id}`)
          if (response.ok) {
            const igdbDetails = await response.json()
            cover = igdbDetails.cover || cover
            tags = igdbDetails.genres || tags
            metacritic = igdbDetails.metacritic || metacritic
            trailerUrl = igdbDetails.trailerUrl
            screenshots = igdbDetails.screenshots
            description = igdbDetails.description
            platforms = igdbDetails.platforms || platforms

            // Check if it's free (common for F2P games like Fortnite)
            if (game.title.toLowerCase().includes('fortnite') ||
                game.title.toLowerCase().includes('warframe') ||
                game.title.toLowerCase().includes('apex legends')) {
              price = 'Free'
            }
          }
        } catch (err) {
          console.error('IGDB details fetch error:', err)
        }
      }

      const newGame = await addGame({
        title: game.title,
        cover,
        tags: tags.slice(0, 3),
        price,
        rawg_id: game.externalIds.steam_appid,
        steam_appid: game.externalIds.steam_appid,
        igdb_id: game.externalIds.igdb_id,
        epic_id: game.externalIds.epic_id,
        xbox_id: game.externalIds.xbox_id,
        gog_id: game.externalIds.gog_id,
        trailer_url: trailerUrl,
        metacritic,
        screenshots,
        description,
        platforms,
        primary_source: game.source,
        platform_availability: game.platformAvailability,
      })

      setAddingId(null)

      if (newGame) {
        onGameAdded(newGame)
        toast.success(`${game.title} added`)
        setResults(prev => prev.filter(r => r.id !== game.id))
      } else {
        toast.error('This game has already been added')
      }
    } catch (error) {
      console.error('Add game error:', error)
      toast.error('Failed to add game')
      setAddingId(null)
    }
  }, [onGameAdded])

  const tabs: { id: SourceTab; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <TbWorldWww className="w-4 h-4" /> },
    { id: 'steam', label: 'Steam', icon: <FaSteam className="w-4 h-4" /> },
    { id: 'igdb', label: 'IGDB', icon: <TbWorldWww className="w-4 h-4" /> },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-text-primary">Add a Game</h2>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-surface-raised border border-border hover:border-border-hover flex items-center justify-center text-text-tertiary hover:text-text-primary transition-all duration-150"
                >
                  <HiX className="w-4 h-4" />
                </button>
              </div>

              {/* Source tabs */}
              <div className="flex gap-2 mb-5">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    disabled={tab.id === 'igdb' && !igdbAvailable}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                      activeTab === tab.id
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'bg-surface-raised border border-border text-text-secondary hover:text-text-primary hover:border-border-hover'
                    } ${tab.id === 'igdb' && !igdbAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="relative search-glow rounded-xl transition-all duration-200">
                <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder={`Search for a game${activeTab !== 'all' ? ` on ${activeTab === 'igdb' ? 'IGDB' : 'Steam'}` : ''}...`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-surface-raised border border-border hover:border-border-hover focus:border-primary/50 rounded-xl pl-12 pr-12 py-3.5 text-base text-text-primary placeholder-text-muted transition-all duration-150 outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-all duration-150"
                  >
                    <HiX className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Results count */}
              {query && !loading && (
                <p className="text-sm text-text-tertiary mt-3">
                  {results.length} result{results.length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
                  <span className="ml-3 text-text-tertiary text-sm">Searching...</span>
                </div>
              )}

              {!loading && query && results.length === 0 && (
                <p className="text-center text-text-tertiary py-12 text-base">
                  No games found
                </p>
              )}

              {!loading && results.map(game => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="bg-surface-raised border border-border hover:border-border-hover rounded-xl p-3.5 flex items-center gap-4 transition-all duration-150 cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-[4.5rem] rounded-xl overflow-hidden flex-shrink-0 bg-surface relative">
                    {game.cover ? (
                      <img
                        src={game.cover}
                        alt={game.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted text-sm">?</div>
                    )}
                    {/* Source badge on thumbnail */}
                    <div className={`absolute bottom-0 right-0 p-1 rounded-tl-lg ${getSourceColor(game.source)}`}>
                      <SourceIcon source={game.source} className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary truncate">{game.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {/* Source badge */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${getSourceColor(game.source)}`}>
                        <SourceIcon source={game.source} className="w-3 h-3" />
                        {game.source === 'igdb' ? 'IGDB' : game.source.charAt(0).toUpperCase() + game.source.slice(1)}
                      </span>

                      {/* Platform availability indicators */}
                      {game.externalIds.steam_appid && game.source !== 'steam' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs bg-[#1B2838] text-[#66C0F4]">
                          <FaSteam className="w-3 h-3" />
                        </span>
                      )}
                      {game.externalIds.epic_id && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs bg-[#2A2A2A] text-white">
                          <SiEpicgames className="w-3 h-3" />
                        </span>
                      )}
                      {game.externalIds.gog_id && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs bg-[#86328A] text-white">
                          <SiGogdotcom className="w-3 h-3" />
                        </span>
                      )}
                      {game.externalIds.xbox_id && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs bg-[#107C10] text-white">
                          <FaXbox className="w-3 h-3" />
                        </span>
                      )}

                      {/* Metacritic score */}
                      {game.metacritic && (
                        <span className={`text-xs font-bold ${
                          game.metacritic >= 75 ? 'text-emerald-400' :
                          game.metacritic >= 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {game.metacritic}
                        </span>
                      )}

                      {/* Price */}
                      {game.price && (
                        <span className="text-xs text-text-tertiary">
                          {game.price}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAdd(game)}
                    disabled={addingId === game.id}
                    className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all duration-150 disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #6F38DC 100%)',
                    }}
                  >
                    {addingId === game.id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <HiPlus className="w-5 h-5" />
                    )}
                  </motion.button>
                </motion.div>
              ))}

              {!loading && !query && (
                <p className="text-center text-white/20 py-8 text-sm">
                  Type a game name to search
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
