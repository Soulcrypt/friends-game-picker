'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { HiThumbUp, HiTrash, HiPlay, HiExternalLink, HiStar } from 'react-icons/hi'
import { FaWindows, FaApple, FaLinux, FaSteam } from 'react-icons/fa'
import type { Game } from '@/lib/types'
import confetti from 'canvas-confetti'

interface GameListItemProps {
  game: Game
  onVote: () => void
  onRemove: () => void
  onPlayTrailer: () => void
  onCardClick: () => void
  rank: number
  index: number
  hasVoted: boolean
  compact?: boolean
}

export default function GameListItem({
  game,
  onVote,
  onRemove,
  onPlayTrailer,
  onCardClick,
  rank,
  index,
  hasVoted,
  compact = false,
}: GameListItemProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const [justVoted, setJustVoted] = useState(false)

  const steamAppId = game.steam_appid || game.rawg_id

  const handleVote = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!hasVoted) {
      confetti({
        particleCount: 30,
        spread: 40,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#8B5CF6', '#3B82F6', '#06B6D4'],
        ticks: 80,
        gravity: 1.2,
        scalar: 0.7,
      })
      setJustVoted(true)
      setTimeout(() => setJustVoted(false), 600)
    }
    onVote()
  }

  const getRankBadge = () => {
    if (game.votes === 0) return null
    if (rank === 1) return { label: '#1', color: 'from-yellow-500 to-amber-600' }
    if (rank === 2) return { label: '#2', color: 'from-gray-300 to-gray-400' }
    if (rank === 3) return { label: '#3', color: 'from-amber-600 to-amber-700' }
    return null
  }

  const rankBadge = getRankBadge()

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ delay: Math.min(index * 0.02, 0.3) }}
        onClick={onCardClick}
        className="glass glass-hover rounded-lg p-2 flex items-center gap-3 cursor-pointer group"
      >
        {/* Rank or index */}
        <div className="w-8 text-center flex-shrink-0">
          {rankBadge ? (
            <span className={`text-xs font-bold bg-gradient-to-br ${rankBadge.color} bg-clip-text text-transparent`}>
              {rankBadge.label}
            </span>
          ) : (
            <span className="text-xs text-white/30">#{rank}</span>
          )}
        </div>

        {/* Cover */}
        <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-white/[0.02]">
          {game.cover && !imgFailed ? (
            <img
              src={game.cover}
              alt={game.title}
              className="w-full h-full object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20 text-lg">?</div>
          )}
        </div>

        {/* Title and tags */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white truncate">{game.title}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-medium ${game.price === 'Free' ? 'text-emerald-400' : 'text-blue-400'}`}>
              {game.price}
            </span>
            {game.metacritic && (
              <span className={`text-[10px] font-bold ${
                game.metacritic >= 75 ? 'text-emerald-400' :
                game.metacritic >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {game.metacritic}
              </span>
            )}
            {game.categories?.some(c => c.includes('Co-op')) && (
              <span className="text-[10px] text-purple-400">Co-op</span>
            )}
          </div>
        </div>

        {/* Vote button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleVote}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            hasVoted
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
              : 'glass text-white/60 hover:text-white'
          } ${justVoted ? 'scale-110' : ''}`}
        >
          <HiThumbUp className="w-3 h-3" />
          {game.votes}
        </motion.button>

        {/* Delete */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
        >
          <HiTrash className="w-4 h-4" />
        </button>
      </motion.div>
    )
  }

  // Full list view
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: Math.min(index * 0.03, 0.4) }}
      onClick={onCardClick}
      className="glass glass-hover rounded-xl p-3 flex items-center gap-4 cursor-pointer group"
    >
      {/* Rank badge */}
      <div className="w-10 text-center flex-shrink-0">
        {rankBadge ? (
          <div className={`w-8 h-8 mx-auto rounded-full bg-gradient-to-br ${rankBadge.color} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
            {rankBadge.label}
          </div>
        ) : (
          <span className="text-sm text-white/30">#{rank}</span>
        )}
      </div>

      {/* Cover */}
      <div className="w-24 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.02]">
        {game.cover && !imgFailed ? (
          <img
            src={game.cover}
            alt={game.title}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-xl">?</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-white truncate">{game.title}</h3>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
            game.price === 'Free' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
          }`}>
            {game.price}
          </span>
          {game.metacritic && (
            <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
              game.metacritic >= 75 ? 'bg-emerald-500/20 text-emerald-300' :
              game.metacritic >= 50 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
            }`}>
              {game.metacritic}
            </span>
          )}
          {game.platforms && (
            <div className="flex items-center gap-1">
              {game.platforms.windows && <FaWindows className="w-3 h-3 text-blue-300/60" />}
              {game.platforms.mac && <FaApple className="w-3 h-3 text-gray-300/60" />}
              {game.platforms.linux && <FaLinux className="w-3 h-3 text-orange-300/60" />}
            </div>
          )}
          {game.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] text-white/40">{tag}</span>
          ))}
        </div>
      </div>

      {/* Player modes */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {game.categories?.some(c => c.includes('Co-op')) && (
          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-medium">Co-op</span>
        )}
        {game.categories?.some(c => c.includes('Multi-player')) && !game.categories?.some(c => c.includes('Co-op')) && (
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-medium">MP</span>
        )}
        {game.categories?.some(c => c === 'Single-player') && (
          <span className="px-2 py-0.5 rounded bg-gray-500/20 text-gray-300 text-[10px] font-medium">Solo</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {game.trailer_url && (
          <button
            onClick={(e) => { e.stopPropagation(); onPlayTrailer() }}
            className="p-2 rounded-lg glass text-white/60 hover:text-white transition-colors"
            title="Watch trailer"
          >
            <HiPlay className="w-4 h-4" />
          </button>
        )}

        {steamAppId && (
          <a
            href={`https://store.steampowered.com/app/${steamAppId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg glass text-white/60 hover:text-white transition-colors"
            title="View on Steam"
          >
            <FaSteam className="w-4 h-4" />
          </a>
        )}

        <motion.button
          whileTap={{ scale: 0.9 }}
          animate={justVoted ? { scale: [1, 1.1, 1] } : {}}
          onClick={handleVote}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
            hasVoted
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
              : 'glass text-white/60 hover:text-white border border-white/[0.06]'
          }`}
        >
          <HiThumbUp className={`w-4 h-4 ${justVoted ? 'animate-bounce' : ''}`} />
          {game.votes}
        </motion.button>

        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
          title="Delete game"
        >
          <HiTrash className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}
