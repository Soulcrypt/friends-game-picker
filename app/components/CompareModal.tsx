'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { HiX, HiThumbUp, HiStar, HiUsers, HiPlay } from 'react-icons/hi'
import { FaWindows, FaApple, FaLinux } from 'react-icons/fa'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import type { Game } from '@/lib/types'

interface CompareModalProps {
  isOpen: boolean
  onClose: () => void
  games: Game[]
  onRemoveGame: (gameId: string) => void
  onVote: (gameId: string) => void
  votedGames: string[]
}

export default function CompareModal({
  isOpen,
  onClose,
  games,
  onRemoveGame,
  onVote,
  votedGames,
}: CompareModalProps) {
  const focusTrapRef = useFocusTrap(isOpen && games.length > 0)

  if (!isOpen || games.length === 0) return null

  const ComparisonRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="grid gap-4" style={{ gridTemplateColumns: `150px repeat(${games.length}, 1fr)` }}>
      <div className="text-sm font-medium text-white/40 py-2">{label}</div>
      {children}
    </div>
  )

  const ComparisonCell = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`py-2 text-sm text-white/80 ${className}`}>{children}</div>
  )

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          ref={focusTrapRef}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Compare Games"
          className="glass-strong rounded-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Compare Games</h2>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-2 rounded-lg glass text-white/60 hover:text-white transition-colors"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>

          {/* Game covers */}
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `150px repeat(${games.length}, 1fr)` }}>
            <div />
            {games.map((game) => (
              <div key={game.id} className="relative">
                <button
                  onClick={() => onRemoveGame(game.id)}
                  className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <HiX className="w-4 h-4" />
                </button>
                <div className="aspect-[460/215] rounded-lg overflow-hidden bg-white/5">
                  {game.cover ? (
                    <img src={game.cover} alt={game.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">?</div>
                  )}
                </div>
                <h3 className="mt-2 font-semibold text-white text-center line-clamp-2">{game.title}</h3>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="space-y-1 divide-y divide-white/5">
            <ComparisonRow label="Price">
              {games.map((game) => (
                <ComparisonCell key={game.id}>
                  <span className={game.price === 'Free' ? 'text-emerald-400' : 'text-blue-400'}>
                    {game.price}
                  </span>
                </ComparisonCell>
              ))}
            </ComparisonRow>

            <ComparisonRow label="Metacritic">
              {games.map((game) => (
                <ComparisonCell key={game.id}>
                  {game.metacritic ? (
                    <span className={`font-bold ${
                      game.metacritic >= 75 ? 'text-emerald-400' :
                      game.metacritic >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {game.metacritic}
                    </span>
                  ) : (
                    <span className="text-white/30">N/A</span>
                  )}
                </ComparisonCell>
              ))}
            </ComparisonRow>

            <ComparisonRow label="Votes">
              {games.map((game) => (
                <ComparisonCell key={game.id}>
                  <span className="flex items-center gap-1">
                    <HiThumbUp className="w-4 h-4 text-purple-400" />
                    {game.votes}
                  </span>
                </ComparisonCell>
              ))}
            </ComparisonRow>

            <ComparisonRow label="Player Modes">
              {games.map((game) => (
                <ComparisonCell key={game.id}>
                  <div className="flex flex-wrap gap-1">
                    {game.categories?.filter(c =>
                      c.includes('player') || c.includes('Player') || c.includes('Co-op') || c.includes('PvP')
                    ).slice(0, 3).map(cat => (
                      <span
                        key={cat}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          cat.includes('Co-op') ? 'bg-purple-500/30 text-purple-300' :
                          cat.includes('Multi') ? 'bg-blue-500/30 text-blue-300' :
                          cat.includes('Single') ? 'bg-gray-500/30 text-gray-300' :
                          'bg-amber-500/30 text-amber-300'
                        }`}
                      >
                        {cat.replace('Multi-player', 'MP').replace('Single-player', 'Solo')}
                      </span>
                    )) || <span className="text-white/30">-</span>}
                  </div>
                </ComparisonCell>
              ))}
            </ComparisonRow>

            <ComparisonRow label="Platforms">
              {games.map((game) => (
                <ComparisonCell key={game.id}>
                  <div className="flex gap-2">
                    {game.platforms?.windows && <FaWindows className="w-4 h-4 text-blue-400" title="Windows" />}
                    {game.platforms?.mac && <FaApple className="w-4 h-4 text-gray-400" title="macOS" />}
                    {game.platforms?.linux && <FaLinux className="w-4 h-4 text-orange-400" title="Linux" />}
                    {!game.platforms && <span className="text-white/30">-</span>}
                  </div>
                </ComparisonCell>
              ))}
            </ComparisonRow>

            <ComparisonRow label="Genres">
              {games.map((game) => (
                <ComparisonCell key={game.id}>
                  <div className="flex flex-wrap gap-1">
                    {game.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-white/50 text-xs">{tag}</span>
                    ))}
                  </div>
                </ComparisonCell>
              ))}
            </ComparisonRow>

            <ComparisonRow label="Release Date">
              {games.map((game) => (
                <ComparisonCell key={game.id}>
                  {game.release_date || <span className="text-white/30">-</span>}
                </ComparisonCell>
              ))}
            </ComparisonRow>
          </div>

          {/* Vote buttons */}
          <div className="grid gap-4 mt-6" style={{ gridTemplateColumns: `150px repeat(${games.length}, 1fr)` }}>
            <div className="text-sm font-medium text-white/40 py-2">Vote</div>
            {games.map((game) => {
              const hasVoted = votedGames.includes(game.id)
              return (
                <motion.button
                  key={game.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onVote(game.id)}
                  className={`w-full rounded-lg py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    hasVoted
                      ? 'text-white shadow-lg'
                      : 'glass text-white/60 hover:text-white border border-white/[0.06]'
                  }`}
                  style={
                    hasVoted
                      ? {
                          background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                          boxShadow: '0 4px 15px rgba(139, 92, 246, 0.25)',
                        }
                      : undefined
                  }
                >
                  <HiThumbUp className="w-4 h-4" />
                  {hasVoted ? 'Voted!' : 'Vote'}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
