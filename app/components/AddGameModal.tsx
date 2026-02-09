'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiSearch, HiX, HiPlus } from 'react-icons/hi'
import { searchSteamGames, getSteamAppDetails, getSteamHeaderUrl, getSteamTrailerUrl } from '@/lib/steam'
import type { SteamSearchResult } from '@/lib/steam'
import { addGame } from '@/lib/votes'
import type { Game } from '@/lib/types'
import toast from 'react-hot-toast'

interface AddGameModalProps {
  isOpen: boolean
  onClose: () => void
  onGameAdded: (game: Game) => void
}

export default function AddGameModal({ isOpen, onClose, onGameAdded }: AddGameModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SteamSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [addingId, setAddingId] = useState<number | null>(null)

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      const data = await searchSteamGames(query)
      setResults(data)
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  const handleAdd = useCallback(async (steamGame: SteamSearchResult) => {
    setAddingId(steamGame.id)

    // Fetch full details from Steam
    const details = await getSteamAppDetails(steamGame.id)

    let trailerUrl: string | undefined
    if (details?.movies?.length) {
      trailerUrl = getSteamTrailerUrl(details.movies[0].id)
    }

    const genres = details?.genres?.map(g => g.description) || []
    const tags = genres.slice(0, 3)

    let price = 'TBD'
    if (details?.is_free) {
      price = 'Free'
    } else if (details?.price_overview) {
      price = details.price_overview.final_formatted
    }

    const newGame = await addGame({
      title: steamGame.name,
      cover: details?.header_image || getSteamHeaderUrl(steamGame.id),
      tags,
      price,
      rawg_id: steamGame.id,
      trailer_url: trailerUrl,
      metacritic: details?.metacritic?.score ?? undefined,
    })

    setAddingId(null)

    if (newGame) {
      onGameAdded(newGame)
      toast.success(`${steamGame.name} added`)
      setResults(prev => prev.filter(r => r.id !== steamGame.id))
    } else {
      toast.error('This game has already been added')
    }
  }, [onGameAdded])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative glass-strong rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/[0.06]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Add a Game</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full glass flex items-center justify-center text-white/50 hover:text-white transition-colors"
                >
                  <HiX className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Search for a game on Steam..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 transition-all"
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-purple-500 rounded-full animate-spin" />
                </div>
              )}

              {!loading && query && results.length === 0 && (
                <p className="text-center text-white/30 py-8 text-sm">
                  No games found
                </p>
              )}

              {!loading && results.map(game => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass glass-hover rounded-xl p-3 flex items-center gap-3 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.03]">
                    {game.tiny_image ? (
                      <img
                        src={game.tiny_image}
                        alt={game.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">?</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">{game.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {game.metascore && (
                        <span className={`text-[10px] font-bold ${
                          parseInt(game.metascore) >= 75 ? 'text-emerald-400' :
                          parseInt(game.metascore) >= 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          Metascore: {game.metascore}
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
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                    }}
                  >
                    {addingId === game.id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <HiPlus className="w-4 h-4" />
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
