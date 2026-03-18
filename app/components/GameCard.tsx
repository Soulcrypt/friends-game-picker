'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { HiTrash, HiBookmark, HiLightningBolt, HiStar, HiPlay, HiArrowLeft } from 'react-icons/hi'
import ReactionButtons from './ReactionButtons'
import { useReactions } from '@/lib/hooks/useReactions'
import type { Game, CardSize } from '@/lib/types'

interface GameCardProps {
  game: Game
  index: number
  rank: number
  hasVoted: boolean
  isPinned?: boolean
  size?: CardSize
  searchTerm?: string
  isPollActive?: boolean
  pollRank?: number | null
  pollVoteCount?: number
  userPollRanks?: { [rank: number]: string }
  isDragging?: boolean
  onVote: () => void
  onRemove: () => void
  onPin?: () => void
  onPlayTrailer?: (game: Game) => void
  onPollRankSelect?: (gameId: string, rank: number | null) => void
}

function getRankClass(rank: number): string {
  if (rank === 1) return 'glow-gold'
  if (rank === 2) return 'glow-silver'
  if (rank === 3) return 'glow-bronze'
  return ''
}

export default function GameCard({
  game,
  index,
  rank,
  hasVoted,
  isPinned = false,
  isPollActive = false,
  pollRank = null,
  pollVoteCount = 0,
  userPollRanks = {},
  isDragging = false,
  onVote,
  onRemove,
  onPin,
  onPlayTrailer,
  onPollRankSelect,
}: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const reactions = useReactions(game.id)

  const isFree = game.price?.toLowerCase() === 'free' || game.price === '$0.00' || game.price === '0'
  const tags = (game.tags ?? []).slice(0, 2)

  const metaScore = game.metacritic ?? null
  const metaColor =
    metaScore != null
      ? metaScore >= 80 ? 'hsl(142 100% 45%)'
      : metaScore >= 60 ? 'hsl(40 90% 55%)'
      : 'hsl(0 75% 55%)'
      : null
  const metaBg =
    metaScore != null
      ? metaScore >= 80 ? 'hsl(142 100% 45% / 0.12)'
      : metaScore >= 60 ? 'hsl(40 90% 55% / 0.12)'
      : 'hsl(0 75% 55% / 0.12)'
      : null

  const rankGlow = getRankClass(rank)
  const hasTrailer = !!game.trailer_url

  // Poll rank helpers
  const pollRanks = [1, 2, 3]
  function handleRankClick(r: number) {
    if (!onPollRankSelect) return
    onPollRankSelect(game.id, pollRank === r ? null : r)
  }
  function isRankTaken(r: number): boolean {
    return userPollRanks[r] !== undefined && userPollRanks[r] !== game.id
  }

  function handleCardClick() {
    if (isDragging) return
    setIsFlipped(f => !f)
  }

  return (
    <motion.div
      className={`game-card group ${rankGlow}`}
      style={{ perspective: '1000px', cursor: 'pointer' }}
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      transition={{ duration: 0.45, delay: Math.min(index * 0.045, 0.45), ease: [0.22, 1, 0.36, 1] }}
      whileHover={!isDragging && !isFlipped ? { y: -6, filter: 'drop-shadow(0 0 10px rgba(191,95,255,0.35)) drop-shadow(0 0 20px rgba(191,95,255,0.15))' } : undefined}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Corner chip */}
      <div
        className="absolute top-[-1px] right-[-1px] w-4 h-4 pointer-events-none z-[5]"
        style={{
          background: isHovered ? 'rgba(191,95,255,0.5)' : 'rgba(191,95,255,0.15)',
          clipPath: 'polygon(0 0, 100% 100%, 100% 0)',
          transition: 'background 0.2s ease',
        }}
      />
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 h-[1px] pointer-events-none z-[5]"
        style={{
          right: '16px',
          background: 'linear-gradient(90deg, transparent, rgba(191,95,255,0.6), transparent)',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Flip container */}
      <motion.div
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full flex flex-col"
      >
        {/* ── FRONT FACE ── */}
        <div style={{ backfaceVisibility: 'hidden' }} className="flex flex-col w-full">
          {/* Cover Art */}
          <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <img
              src={game.cover ?? ''}
              alt={game.title}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
              loading="lazy"
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 card-overlay" />

            {/* Neon scan line on hover */}
            <div
              className="absolute inset-x-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                top: '50%',
                background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.8), transparent)',
                boxShadow: '0 0 12px hsl(var(--primary) / 0.6)',
              }}
            />

            {/* Metacritic — top left */}
            {metaScore != null && (
              <div
                className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 text-xs font-bold"
                style={{
                  background: metaBg ?? undefined,
                  color: metaColor ?? undefined,
                  border: `1px solid ${metaColor}40`,
                  borderRadius: '2px',
                  fontFamily: "'Space Mono', monospace",
                  boxShadow: `0 0 10px ${metaColor}30`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <HiStar className="w-2.5 h-2.5" aria-hidden="true" />
                <span className="sr-only">Metacritic score: </span>
                {metaScore}
              </div>
            )}

            {/* Price — top right */}
            <div className="absolute top-2 right-2">
              <span className={`price-badge ${isFree ? 'free' : ''}`}>
                {isFree ? 'FREE' : (game.price ?? 'TBD')}
              </span>
            </div>

            {/* Vote count — bottom right */}
            {(game.votes ?? 0) > 0 && (
              <motion.div
                className="absolute bottom-2 right-2 flex items-center gap-1 px-2.5 py-1 text-xs font-bold"
                style={{
                  background: 'hsl(var(--vote) / 0.15)',
                  color: 'hsl(var(--neon-green))',
                  border: '1px solid hsl(var(--vote) / 0.5)',
                  borderRadius: '2px',
                  boxShadow: '0 0 12px hsl(var(--vote) / 0.3)',
                  fontFamily: "'Space Mono', monospace",
                }}
                key={game.votes}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <HiLightningBolt className="w-2.5 h-2.5" aria-hidden="true" />
                <span className="sr-only">Votes: </span>
                {game.votes}
              </motion.div>
            )}

            {/* Action buttons — bottom left, shown on hover */}
            <div
              className="absolute bottom-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {onPin && (
                <button
                  onClick={() => onPin()}
                  className="w-7 h-7 flex items-center justify-center rounded"
                  style={{
                    background: isPinned ? 'rgba(191,95,255,0.25)' : 'rgba(13,17,26,0.7)',
                    border: `1px solid ${isPinned ? 'rgba(191,95,255,0.5)' : 'rgba(191,95,255,0.2)'}`,
                    color: isPinned ? 'rgb(191,95,255)' : 'rgba(150,165,185,0.8)',
                    backdropFilter: 'blur(8px)',
                  }}
                  aria-label={isPinned ? `Unpin ${game.title}` : `Pin ${game.title}`}
                  aria-pressed={isPinned}
                >
                  <HiBookmark className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
              <button
                onClick={() => onRemove()}
                className="w-7 h-7 flex items-center justify-center rounded"
                style={{
                  background: 'rgba(255,69,58,0.15)',
                  border: '1px solid rgba(255,69,58,0.3)',
                  color: 'rgba(255,69,58,0.8)',
                  backdropFilter: 'blur(8px)',
                }}
                aria-label={`Remove ${game.title}`}
              >
                <HiTrash className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Card Content */}
          <div className="flex flex-col flex-1 p-4 gap-2.5">
            {/* Title */}
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-display font-bold leading-tight line-clamp-2 mb-1 transition-all duration-200 ${isHovered ? 'neon-text' : ''}`}
                  style={{
                    fontSize: '1rem',
                    letterSpacing: '0.03em',
                    color: isHovered ? undefined : 'hsl(var(--foreground))',
                  }}
                >
                  {game.title}
                </h3>
                {game.short_description && (
                  <p
                    className="text-xs leading-relaxed line-clamp-2"
                    style={{ color: 'hsl(var(--muted-foreground))', fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {game.short_description}
                  </p>
                )}
              </div>
              {isPinned && (
                <HiBookmark className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'rgb(191,95,255)' }} />
              )}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span key={tag} className="tag-pill text-[9px]">{tag}</span>
                ))}
              </div>
            )}

            {/* Poll rank selector */}
            {isPollActive && onPollRankSelect && (
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                {pollRanks.map((r) => {
                  const isSelected = pollRank === r
                  const taken = isRankTaken(r)
                  return (
                    <button
                      key={r}
                      onClick={() => !taken && handleRankClick(r)}
                      disabled={taken}
                      className="flex-1 py-1 text-xs font-bold transition-all duration-150"
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        borderRadius: '2px',
                        border: isSelected ? '1px solid rgba(191,95,255,0.7)' : '1px solid rgba(191,95,255,0.2)',
                        background: isSelected ? 'rgba(191,95,255,0.2)' : 'rgba(191,95,255,0.04)',
                        color: isSelected ? 'rgb(191,95,255)' : taken ? 'rgba(150,165,185,0.3)' : 'rgba(150,165,185,0.7)',
                        cursor: taken ? 'not-allowed' : 'pointer',
                      }}
                    >
                      #{r}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Poll points */}
            {isPollActive && pollVoteCount > 0 && (
              <div className="text-xs font-bold text-center py-1" style={{ color: 'hsl(var(--neon-green))', fontFamily: "'Space Mono', monospace" }}>
                {pollVoteCount} poll pts
              </div>
            )}

            {/* Vote Button */}
            <div className="mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
              <button
                className={`btn-vote ${hasVoted ? 'voted' : ''} w-full py-2`}
                onClick={onVote}
                aria-pressed={hasVoted}
                aria-label={`${hasVoted ? 'Remove vote from' : 'Vote for'} ${game.title}`}
              >
                {!hasVoted && (
                  <span
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent 30%, hsl(var(--primary) / 0.08) 50%, transparent 70%)' }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <HiLightningBolt className="w-4 h-4" aria-hidden="true" />
                  {hasVoted ? 'VOTED' : 'VOTE'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── BACK FACE ── */}
        <div
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', inset: 0, overflow: 'hidden' }}
          className="flex flex-col"
        >
          {/* Back cover (blurred) */}
          <div className="relative overflow-hidden flex-shrink-0" style={{ aspectRatio: '16/9' }}>
            <img
              src={game.cover ?? ''}
              alt={game.title}
              className="w-full h-full object-cover blur-sm scale-105 brightness-50"
            />
            <div className="absolute inset-0" style={{ background: 'rgba(13,17,26,0.75)' }} />
            {/* Flip back button */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsFlipped(false) }}
              className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 text-xs font-mono font-bold transition-all duration-150"
              style={{
                background: 'rgba(13,17,26,0.8)',
                border: '1px solid rgba(191,95,255,0.3)',
                color: 'rgba(191,95,255,0.9)',
                borderRadius: '2px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <HiArrowLeft className="w-3 h-3" />
              BACK
            </button>
            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3" style={{ background: 'linear-gradient(to top, rgba(13,17,26,0.95), transparent)' }}>
              <h3 className="font-display font-bold text-white leading-tight" style={{ fontSize: '0.95rem', letterSpacing: '0.03em' }}>
                {game.title}
              </h3>
            </div>
          </div>

          {/* Back content — scrollable info area + pinned buttons */}
          <div className="flex flex-col flex-1 min-h-0" style={{ background: 'rgb(var(--color-surface))' }}>
            {/* Scrollable info */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 pb-2 flex flex-col gap-3">
              {/* Description */}
              {game.short_description && (
                <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {game.short_description}
                </p>
              )}

              {/* Meta info row */}
              <div className="flex flex-wrap gap-2 text-xs font-mono" style={{ color: 'rgba(150,165,185,0.7)' }}>
                {metaScore != null && (
                  <span style={{ color: metaColor ?? undefined }}>★ {metaScore}</span>
                )}
                {game.release_date && (
                  <span>{new Date(game.release_date).getFullYear()}</span>
                )}
                {game.developers?.[0] && (
                  <span className="truncate">{game.developers[0]}</span>
                )}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => <span key={tag} className="tag-pill text-[9px]">{tag}</span>)}
                </div>
              )}

              {/* Reactions */}
              {!reactions.loading && (
                <div onClick={(e) => e.stopPropagation()}>
                  <ReactionButtons
                    counts={reactions.counts}
                    userReactions={reactions.userReactions}
                    onToggle={reactions.handleToggle}
                  />
                </div>
              )}
            </div>

            {/* Pinned action buttons — never scroll away */}
            <div className="flex flex-col gap-2 p-4 pt-2" onClick={(e) => e.stopPropagation()}>
              {hasTrailer && onPlayTrailer && (
                <button
                  onClick={() => onPlayTrailer(game)}
                  className="w-full py-2 flex items-center justify-center gap-2 text-sm font-display font-bold tracking-widest uppercase transition-all duration-150"
                  style={{
                    background: 'hsl(var(--primary) / 0.15)',
                    border: '1.5px solid hsl(var(--primary) / 0.5)',
                    color: 'hsl(var(--primary))',
                    borderRadius: '2px',
                    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                  }}
                >
                  <HiPlay className="w-4 h-4" />
                  TRAILER
                </button>
              )}
              <button
                className={`btn-vote ${hasVoted ? 'voted' : ''} w-full py-2`}
                onClick={onVote}
                aria-pressed={hasVoted}
                aria-label={`${hasVoted ? 'Remove vote from' : 'Vote for'} ${game.title}`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <HiLightningBolt className="w-4 h-4" aria-hidden="true" />
                  {hasVoted ? 'VOTED' : 'VOTE'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
