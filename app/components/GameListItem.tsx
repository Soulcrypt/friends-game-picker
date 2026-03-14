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
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
          layout: { type: 'spring', stiffness: 300, damping: 30 },
        }}
        onClick={onCardClick}
        className="surface-card rounded-xl p-3 flex items-center gap-3 cursor-pointer group"
      >
        {/* Rank or index */}
        <div className="w-8 text-center flex-shrink-0">
          {rankBadge ? (
            <span className={`text-sm font-bold bg-gradient-to-br ${rankBadge.color} bg-clip-text text-transparent`}>
              {rankBadge.label}
            </span>
          ) : (
            <span className="text-sm text-text-tertiary">#{rank}</span>
          )}
        </div>

        {/* Cover */}
        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-surface-raised">
          {game.cover && !imgFailed ? (
            <img
              src={game.cover}
              alt={game.title}
              className="w-full h-full object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted text-lg">?</div>
          )}
        </div>

        {/* Title and tags */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate">{game.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-medium ${game.price === 'Free' ? 'text-emerald-400' : 'text-primary'}`}>
              {game.price}
            </span>
            {game.metacritic && (
              <span className={`text-xs font-bold ${
                game.metacritic >= 75 ? 'text-emerald-400' :
                game.metacritic >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {game.metacritic}
              </span>
            )}
            {game.categories?.some(c => c.includes('Co-op')) && (
              <span className="text-xs text-purple-400">Co-op</span>
            )}
          </div>
        </div>

        {/* Vote button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleVote}
          className={`px-3.5 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all duration-150 ${
            hasVoted
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-surface-raised border border-border text-text-secondary hover:text-text-primary hover:border-border-hover'
          } ${justVoted ? 'scale-105' : ''}`}
        >
          <HiThumbUp className="w-3.5 h-3.5" />
          {game.votes}
        </motion.button>

        {/* Delete */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 opacity-0 group-hover:opacity-100"
        >
          <HiTrash className="w-4 h-4" />
        </button>
      </motion.div>
    )
  }

  // Full list view
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        layout: { type: 'spring', stiffness: 300, damping: 30 },
      }}
      onClick={onCardClick}
      className="surface-card rounded-xl p-4 flex items-center gap-4 cursor-pointer group"
    >
      {/* Rank badge */}
      <div className="w-12 text-center flex-shrink-0">
        {rankBadge ? (
          <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${rankBadge.color} flex items-center justify-center text-sm font-bold text-white shadow-lg`}>
            {rankBadge.label}
          </div>
        ) : (
          <span className="text-sm text-text-tertiary">#{rank}</span>
        )}
      </div>

      {/* Cover */}
      <div className="w-28 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-raised">
        {game.cover && !imgFailed ? (
          <img
            src={game.cover}
            alt={game.title}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-xl">?</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-text-primary truncate">{game.title}</h3>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
            game.price === 'Free' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-primary/15 text-primary border border-primary/20'
          }`}>
            {game.price}
          </span>
          {game.metacritic && (
            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
              game.metacritic >= 75 ? 'bg-emerald-500/15 text-emerald-400' :
              game.metacritic >= 50 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'
            }`}>
              {game.metacritic}
            </span>
          )}
          {game.platforms && (
            <div className="flex items-center gap-1.5 ml-1">
              {game.platforms.windows && <FaWindows className="w-3.5 h-3.5 text-text-tertiary" />}
              {game.platforms.mac && <FaApple className="w-3.5 h-3.5 text-text-tertiary" />}
              {game.platforms.linux && <FaLinux className="w-3.5 h-3.5 text-text-tertiary" />}
            </div>
          )}
          {game.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-xs text-text-tertiary">{tag}</span>
          ))}
        </div>
      </div>

      {/* Player modes */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {game.categories?.some(c => c.includes('Co-op')) && (
          <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-400 text-xs font-medium border border-purple-500/20">Co-op</span>
        )}
        {game.categories?.some(c => c.includes('Multi-player')) && !game.categories?.some(c => c.includes('Co-op')) && (
          <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-medium border border-blue-500/20">MP</span>
        )}
        {game.categories?.some(c => c === 'Single-player') && (
          <span className="px-2.5 py-1 rounded-lg bg-surface-raised text-text-tertiary text-xs font-medium border border-border">Solo</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {game.trailer_url && (
          <button
            onClick={(e) => { e.stopPropagation(); onPlayTrailer() }}
            className="p-2.5 rounded-xl bg-surface-raised border border-border text-text-tertiary hover:text-text-primary hover:border-border-hover transition-all duration-150"
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
            className="p-2.5 rounded-xl bg-surface-raised border border-border text-text-tertiary hover:text-text-primary hover:border-border-hover transition-all duration-150"
            title="View on Steam"
          >
            <FaSteam className="w-4 h-4" />
          </a>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          animate={justVoted ? { scale: [1, 1.05, 1] } : {}}
          onClick={handleVote}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-150 ${
            hasVoted
              ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
              : 'bg-surface-raised text-text-secondary hover:text-text-primary border border-border hover:border-border-hover'
          }`}
        >
          <HiThumbUp className={`w-4 h-4 ${justVoted ? 'animate-bounce' : ''}`} />
          {game.votes}
        </motion.button>

        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="p-2.5 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 opacity-0 group-hover:opacity-100"
          title="Delete game"
        >
          <HiTrash className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}
