'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { HiHeart, HiPlay, HiInformationCircle, HiTrash, HiStar, HiUsers } from 'react-icons/hi'
import { HiTrophy } from 'react-icons/hi2'
import { FaSteam } from 'react-icons/fa'
import confetti from 'canvas-confetti'
import type { Game, CardSize } from '@/lib/types'

interface MobileGameCardProps {
  game: Game
  onVote: () => void
  onRemove: () => void
  onPlayTrailer: () => void
  onCardClick: () => void
  onPin?: () => void
  onPollRankSelect?: (gameId: string, rank: number | null) => void
  rank: number
  index: number
  hasVoted: boolean
  isPinned?: boolean
  pollRank?: number | null
  pollVoteCount?: number
  isPollActive?: boolean
  userPollRanks?: { [rank: number]: string }
}

export default function MobileGameCard({
  game,
  onVote,
  onRemove,
  onPlayTrailer,
  onCardClick,
  onPin,
  onPollRankSelect,
  rank,
  index,
  hasVoted,
  isPinned = false,
  pollRank,
  pollVoteCount,
  isPollActive = false,
  userPollRanks = {},
}: MobileGameCardProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const [justVoted, setJustVoted] = useState(false)
  const [showRankSelector, setShowRankSelector] = useState(false)

  const getRankBadge = () => {
    if (game.votes === 0) return null
    if (rank === 1) return { label: '#1', color: 'from-yellow-500 to-amber-600' }
    if (rank === 2) return { label: '#2', color: 'from-gray-300 to-gray-400' }
    if (rank === 3) return { label: '#3', color: 'from-amber-600 to-amber-700' }
    return null
  }

  const handleVoteWithAnimation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!hasVoted) {
      confetti({
        particleCount: 20,
        spread: 40,
        origin: { x: 0.5, y: 0.6 },
        colors: ['#EC4899', '#F43F5E', '#F97316'],
        ticks: 60,
        gravity: 1.5,
        scalar: 0.5,
      })
      setJustVoted(true)
      setTimeout(() => setJustVoted(false), 600)
    }
    onVote()
  }, [hasVoted, onVote])

  const handleRankSelect = (rankNum: number) => {
    if (onPollRankSelect) {
      onPollRankSelect(game.id, rankNum)
      setShowRankSelector(false)
    }
  }

  const rankBadge = getRankBadge()
  const showCover = game.cover && !imgFailed
  const hasTrailer = !!game.trailer_url
  const steamAppId = game.steam_appid || game.rawg_id

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="glass rounded-xl overflow-hidden"
    >
      <div className="flex">
        {/* Cover image - left side */}
        <div
          className="relative w-28 h-24 shrink-0 cursor-pointer"
          onClick={onCardClick}
        >
          {showCover ? (
            <img
              src={game.cover}
              alt={game.title}
              className="w-full h-full object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center">
              <span className="text-2xl text-white/10">?</span>
            </div>
          )}

          {/* Rank badge */}
          {rankBadge && (
            <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-gradient-to-br ${rankBadge.color} flex items-center justify-center text-[10px] font-bold text-white shadow-lg`}>
              {rankBadge.label}
            </div>
          )}

          {/* Poll rank indicator */}
          {pollRank && (
            <div className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-lg ${
              pollRank === 1 ? 'bg-yellow-500 text-white' :
              pollRank === 2 ? 'bg-gray-300 text-gray-800' :
              'bg-amber-600 text-white'
            }`}>
              {pollRank === 1 ? '1st' : pollRank === 2 ? '2nd' : '3rd'}
            </div>
          )}

          {/* Play trailer overlay */}
          {hasTrailer && (
            <button
              onClick={(e) => { e.stopPropagation(); onPlayTrailer() }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 active:opacity-100 transition-opacity"
            >
              <HiPlay className="w-8 h-8 text-white" />
            </button>
          )}
        </div>

        {/* Content - right side */}
        <div className="flex-1 p-3 min-w-0 flex flex-col justify-between">
          {/* Title and info */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3
                className="font-medium text-sm text-white line-clamp-1 cursor-pointer"
                onClick={onCardClick}
              >
                {game.title}
              </h3>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {onPin && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onPin() }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isPinned ? 'text-amber-400' : 'text-white/30'
                    }`}
                  >
                    <HiStar className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove() }}
                  className="p-1.5 rounded-lg text-white/30 active:text-red-400 transition-colors"
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tags row */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                game.price === 'Free' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-blue-500/30 text-blue-300'
              }`}>
                {game.price}
              </span>
              {game.metacritic && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  game.metacritic >= 75 ? 'bg-emerald-500/30 text-emerald-300' :
                  game.metacritic >= 50 ? 'bg-amber-500/30 text-amber-300' :
                  'bg-red-500/30 text-red-300'
                }`}>
                  {game.metacritic}
                </span>
              )}
              {game.categories?.some(c => c.includes('Co-op')) && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/30 text-purple-300 flex items-center gap-0.5">
                  <HiUsers className="w-2.5 h-2.5" />
                  Co-op
                </span>
              )}
              {game.tags.slice(0, 1).map(tag => (
                <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] text-white/40 bg-white/5">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom action row */}
          <div className="flex items-center gap-2 mt-2">
            {/* Poll voting or Interest button */}
            {isPollActive && onPollRankSelect ? (
              pollRank ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onPollRankSelect(game.id, null) }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-xs font-medium text-purple-300"
                >
                  <HiTrophy className="w-3.5 h-3.5" />
                  {pollRank === 1 ? '1st' : pollRank === 2 ? '2nd' : '3rd'} Choice
                </button>
              ) : showRankSelector ? (
                <div className="flex-1 flex items-center gap-1">
                  {[1, 2, 3].map(r => {
                    const isOccupied = !!(userPollRanks[r] && userPollRanks[r] !== game.id)
                    return (
                      <button
                        key={r}
                        onClick={(e) => { e.stopPropagation(); handleRankSelect(r) }}
                        disabled={isOccupied}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          isOccupied ? 'bg-white/5 text-white/30' :
                          r === 1 ? 'bg-yellow-500 text-white' :
                          r === 2 ? 'bg-gray-300 text-gray-800' :
                          'bg-amber-600 text-white'
                        }`}
                      >
                        {r === 1 ? '1st' : r === 2 ? '2nd' : '3rd'}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowRankSelector(true) }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg glass border border-purple-500/20 text-xs font-medium text-purple-300"
                >
                  <HiTrophy className="w-3.5 h-3.5" />
                  Add to Poll
                </button>
              )
            ) : (
              <button
                onClick={handleVoteWithAnimation}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  hasVoted
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                    : 'glass border border-white/10 text-white/60'
                } ${justVoted ? 'scale-95' : ''}`}
              >
                <HiHeart className={`w-3.5 h-3.5 ${hasVoted ? 'fill-current' : ''}`} />
                {game.votes} interested
              </button>
            )}

            {/* Details button */}
            <button
              onClick={onCardClick}
              className="p-2 rounded-lg glass text-white/50"
            >
              <HiInformationCircle className="w-4 h-4" />
            </button>

            {/* Steam link */}
            {steamAppId && (
              <a
                href={`https://store.steampowered.com/app/${steamAppId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-lg glass text-white/50"
              >
                <FaSteam className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
