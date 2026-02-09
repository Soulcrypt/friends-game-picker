'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiThumbUp, HiTrash, HiPlay, HiArrowLeft, HiExternalLink, HiUsers, HiRefresh, HiInformationCircle, HiStar } from 'react-icons/hi'
import { FaWindows, FaApple, FaLinux, FaSteam } from 'react-icons/fa'
import confetti from 'canvas-confetti'
import type { Game, ReactionType, ReactionCounts } from '@/lib/types'
import { getSessionId, getReactions, getUserReactions, toggleReaction } from '@/lib/votes'
import { fetchGameDetails } from '@/lib/steam'
import ReactionButtons from './ReactionButtons'
import ScreenshotSlideshow from './ScreenshotSlideshow'

import type { CardSize } from '@/lib/types'

interface GameCardProps {
  game: Game
  onVote: () => void
  onRemove: () => void
  onPlayTrailer: () => void
  onRefresh: (gameId: string) => Promise<void>
  onPin?: () => void
  rank: number
  index: number
  hasVoted: boolean
  isPinned?: boolean
  size?: CardSize
}

export default function GameCard({ game, onVote, onRemove, onPlayTrailer, onRefresh, onPin, rank, index, hasVoted, isPinned = false, size = 'medium' }: GameCardProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const [imgLoading, setImgLoading] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [reactionCounts, setReactionCounts] = useState<ReactionCounts>({ played: 0, own: 0, try: 0 })
  const [userReactions, setUserReactions] = useState<ReactionType[]>([])
  const [detailedGame, setDetailedGame] = useState<Game>(game)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentScreenshot, setCurrentScreenshot] = useState(0)
  const [justVoted, setJustVoted] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const quickActionsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadReactions()
  }, [game.id])

  // Update detailedGame when game prop changes
  useEffect(() => {
    setDetailedGame(prev => ({ ...prev, ...game }))
  }, [game])

  async function loadReactions() {
    const sessionId = getSessionId()
    if (!sessionId) return

    const [counts, reactions] = await Promise.all([
      getReactions(game.id),
      getUserReactions(game.id, sessionId),
    ])

    setReactionCounts(counts)
    setUserReactions(reactions)
  }

  async function handleToggleReaction(type: ReactionType) {
    const sessionId = getSessionId()
    if (!sessionId) return

    const result = await toggleReaction(game.id, sessionId, type)
    setReactionCounts(result.counts)
    setUserReactions(prev =>
      result.added ? [...prev, type] : prev.filter(r => r !== type)
    )
  }

  const handleMouseEnter = useCallback(() => {
    if (isFlipped) return
    hoverTimerRef.current = setTimeout(() => {
      setIsHovered(true)
    }, 400)
    // Show quick actions after a short delay
    quickActionsTimerRef.current = setTimeout(() => {
      setShowQuickActions(true)
    }, 150)
  }, [isFlipped])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    if (quickActionsTimerRef.current) {
      clearTimeout(quickActionsTimerRef.current)
      quickActionsTimerRef.current = null
    }
    setIsHovered(false)
    setShowQuickActions(false)
    setVideoReady(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [])

  // Vote with confetti animation
  const handleVoteWithAnimation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()

    // Trigger confetti if this is a new vote
    if (!hasVoted && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      const x = (rect.left + rect.width / 2) / window.innerWidth
      const y = (rect.top + rect.height / 2) / window.innerHeight

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x, y },
        colors: ['#8B5CF6', '#3B82F6', '#06B6D4'],
        ticks: 100,
        gravity: 1.2,
        scalar: 0.8,
      })

      setJustVoted(true)
      setTimeout(() => setJustVoted(false), 600)
    }

    onVote()
  }, [hasVoted, onVote])

  // Use steam_appid or rawg_id (both store Steam app ID)
  const steamAppId = game.steam_appid || game.rawg_id

  const handleCardClick = async () => {
    if (!isFlipped) {
      setIsFlipped(true)
      // Fetch full details if we don't have them
      if (!detailedGame.description && steamAppId) {
        setLoadingDetails(true)
        try {
          const details = await fetchGameDetails(steamAppId)
          if (details) {
            setDetailedGame(prev => ({
              ...prev,
              description: details.description,
              short_description: details.short_description,
              screenshots: details.screenshots,
              platforms: details.platforms,
              developers: details.developers,
              publishers: details.publishers,
              release_date: details.release_date,
              trailer_url: details.trailer_url || prev.trailer_url,
            }))
          }
        } catch (err) {
          console.error('Failed to fetch game details:', err)
        } finally {
          setLoadingDetails(false)
        }
      }
    }
  }

  const handleFlipBack = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsFlipped(false)
    setCurrentScreenshot(0)
  }

  const getRankClass = () => {
    if (game.votes === 0) return ''
    if (rank === 1) return 'glow-gold'
    if (rank === 2) return 'glow-silver'
    if (rank === 3) return 'glow-bronze'
    return ''
  }

  const getRankBadge = () => {
    if (game.votes === 0) return null
    if (rank === 1) return { label: '#1', color: 'from-yellow-500 to-amber-600', animate: true }
    if (rank === 2) return { label: '#2', color: 'from-gray-300 to-gray-400', animate: false }
    if (rank === 3) return { label: '#3', color: 'from-amber-600 to-amber-700', animate: false }
    return null
  }

  const getPriceBadgeStyle = () => {
    if (game.price === 'Free') return 'from-emerald-500/80 to-emerald-600/80'
    if (game.price.includes('$')) return 'from-blue-500/80 to-blue-600/80'
    return 'from-orange-500/80 to-orange-600/80'
  }

  const showCover = game.cover && !imgFailed
  const rankBadge = getRankBadge()
  const hasTrailer = !!game.trailer_url
  const hasScreenshots = game.screenshots && game.screenshots.length > 0
  const showVideo = hasTrailer && isHovered && !videoError && !isFlipped
  const showScreenshots = !hasTrailer && hasScreenshots && isHovered && !isFlipped

  // Strip HTML tags from description
  const cleanDescription = (html: string) => {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .trim()
  }

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={isFlipped ? undefined : { y: -6 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: Math.min(index * 0.04, 0.4),
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative group perspective-1000"
      style={{ perspective: '1000px' }}
    >
      {/* Gradient border layer */}
      <div className={`absolute inset-0 rounded-2xl gradient-border transition-opacity duration-300 ${
        isFlipped ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`} />

      {/* Card container with flip */}
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative"
      >
        {/* Front of card */}
        <div
          onClick={handleCardClick}
          className={`relative glass rounded-2xl overflow-hidden m-[1px] transition-all duration-300 cursor-pointer ${getRankClass()}`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Top left buttons */}
          <div className="absolute top-2 left-2 z-20 flex gap-1.5">
            {/* Pin button */}
            {onPin && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation()
                  onPin()
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  isPinned
                    ? 'bg-amber-500 text-white'
                    : 'bg-black/40 hover:bg-amber-500/80 text-white/60 hover:text-white'
                }`}
                title={isPinned ? 'Unpin game' : 'Pin to top'}
              >
                <HiStar className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
              </motion.button>
            )}

            {/* Delete button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white shadow-lg transition-all"
              title="Delete game (can undo)"
            >
              <HiTrash className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Rank badge */}
          {rankBadge && (
            <div
              className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-gradient-to-br ${rankBadge.color} flex items-center justify-center text-xs font-bold text-white shadow-lg ${
                rankBadge.animate ? 'animate-pulse-glow' : ''
              }`}
            >
              {rankBadge.label}
            </div>
          )}

          {/* Cover area */}
          <div className="relative aspect-[460/215] overflow-hidden bg-white/[0.02]">
            {/* Image loading blur placeholder */}
            {imgLoading && showCover && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-cyan-900/30 animate-pulse" />
            )}

            {showCover ? (
              <img
                src={game.cover}
                alt={game.title}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                  imgLoading ? 'opacity-0 scale-105 blur-sm' : 'opacity-100 scale-100 blur-0'
                }`}
                style={{ opacity: (showVideo && videoReady) || showScreenshots ? 0 : imgLoading ? 0 : 1 }}
                onLoad={() => setImgLoading(false)}
                onError={() => { setImgFailed(true); setImgLoading(false) }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex flex-col items-center justify-center gap-2 p-4">
                <span className="text-3xl text-white/10">?</span>
                <span className="text-[11px] text-white/20 text-center leading-tight truncate w-full">
                  {game.title}
                </span>
              </div>
            )}

            {showScreenshots && (
              <ScreenshotSlideshow
                screenshots={game.screenshots || []}
                isActive={isHovered}
              />
            )}

            {showVideo && (
              <video
                ref={videoRef}
                src={game.trailer_url}
                muted
                autoPlay
                loop
                playsInline
                onCanPlayThrough={() => setVideoReady(true)}
                onError={() => setVideoError(true)}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                style={{ opacity: videoReady ? 1 : 0 }}
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

            {/* Quick actions overlay on hover */}
            <AnimatePresence>
              {showQuickActions && !isFlipped && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 z-10 flex items-center justify-center gap-3"
                >
                  {/* Vote button */}
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ delay: 0.05 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleVoteWithAnimation}
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
                      hasVoted
                        ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                        : 'glass-strong text-white/80 hover:text-white'
                    }`}
                    title={hasVoted ? 'Remove vote' : 'Vote for this game'}
                  >
                    <HiThumbUp className="w-5 h-5" />
                  </motion.button>

                  {/* Play trailer button */}
                  {hasTrailer && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ delay: 0.1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); onPlayTrailer() }}
                      className="w-12 h-12 rounded-full glass-strong flex items-center justify-center text-white/80 hover:text-white shadow-lg"
                      title="Watch trailer"
                    >
                      <HiPlay className="w-5 h-5 ml-0.5" />
                    </motion.button>
                  )}

                  {/* Details button */}
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ delay: 0.15 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCardClick}
                    className="w-12 h-12 rounded-full glass-strong flex items-center justify-center text-white/80 hover:text-white shadow-lg"
                    title="View details"
                  >
                    <HiInformationCircle className="w-5 h-5" />
                  </motion.button>

                  {/* Steam link */}
                  {steamAppId && (
                    <motion.a
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ delay: 0.2 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      href={`https://store.steampowered.com/app/${steamAppId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-12 h-12 rounded-full glass-strong flex items-center justify-center text-white/80 hover:text-white shadow-lg"
                      title="View on Steam"
                    >
                      <FaSteam className="w-5 h-5" />
                    </motion.a>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className={`bg-gradient-to-r ${getPriceBadgeStyle()} backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-semibold text-white`}>
                  {game.price}
                </div>
                {game.metacritic && (
                  <div
                    className={`backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      game.metacritic >= 75
                        ? 'bg-emerald-500/60 text-white'
                        : game.metacritic >= 50
                        ? 'bg-yellow-500/60 text-white'
                        : 'bg-red-500/60 text-white'
                    }`}
                  >
                    {game.metacritic}
                  </div>
                )}
                {/* Platform icons */}
                {game.platforms && (
                  <div className="flex items-center gap-1 backdrop-blur-sm bg-black/40 px-1.5 py-0.5 rounded-md">
                    {game.platforms.windows && <FaWindows className="w-3 h-3 text-blue-300" title="Windows" />}
                    {game.platforms.mac && <FaApple className="w-3 h-3 text-gray-300" title="macOS" />}
                    {game.platforms.linux && <FaLinux className="w-3 h-3 text-orange-300" title="Linux" />}
                  </div>
                )}
                {/* Early Access badge */}
                {game.categories?.some(c => c.toLowerCase().includes('early access')) && (
                  <div className="backdrop-blur-sm bg-amber-500/60 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white">
                    Early Access
                  </div>
                )}
                {game.categories?.some(c => c.includes('Co-op')) && (
                  <div className="backdrop-blur-sm bg-purple-500/60 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white">
                    Co-op
                  </div>
                )}
                {game.categories?.some(c => c.includes('Multi-player')) && !game.categories?.some(c => c.includes('Co-op')) && (
                  <div className="backdrop-blur-sm bg-blue-500/60 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white">
                    MP
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-[13px] text-white line-clamp-2 leading-snug drop-shadow-lg">
                {game.title}
              </h3>
            </div>
          </div>

          <div className="p-3.5 space-y-3">
            {/* Player modes - prominent display */}
            {game.categories && game.categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {game.categories
                  .filter(c =>
                    c === 'Single-player' ||
                    c === 'Multi-player' ||
                    c.includes('Co-op') ||
                    c.includes('PvP')
                  )
                  .slice(0, 3)
                  .map(cat => (
                    <span
                      key={cat}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        cat.includes('Co-op') ? 'bg-purple-500/30 text-purple-300' :
                        cat.includes('Multi') ? 'bg-blue-500/30 text-blue-300' :
                        cat === 'Single-player' ? 'bg-gray-500/30 text-gray-300' :
                        'bg-amber-500/30 text-amber-300'
                      }`}
                    >
                      <HiUsers className="w-3 h-3" />
                      {cat}
                    </span>
                  ))}
              </div>
            )}

            {/* Genre tags */}
            <div className="flex flex-wrap gap-1">
              {game.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="glass px-2 py-0.5 rounded-md text-[11px] tracking-wide font-medium text-white/40"
                >
                  {tag}
                </span>
              ))}
            </div>

            <ReactionButtons
              counts={reactionCounts}
              userReactions={userReactions}
              onToggle={handleToggleReaction}
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={justVoted ? { scale: [1, 1.05, 1] } : {}}
              onClick={handleVoteWithAnimation}
              className={`w-full rounded-lg py-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                hasVoted
                  ? 'text-white shadow-lg'
                  : 'glass text-white/50 hover:text-white border border-white/[0.06] hover:border-white/[0.12]'
              } ${justVoted ? 'ring-2 ring-purple-400/50 ring-offset-2 ring-offset-transparent' : ''}`}
              style={
                hasVoted
                  ? {
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                      boxShadow: justVoted ? '0 4px 25px rgba(139, 92, 246, 0.5)' : '0 4px 15px rgba(139, 92, 246, 0.25)',
                    }
                  : undefined
              }
            >
              <HiThumbUp className={`w-4 h-4 ${hasVoted ? 'text-white' : ''} ${justVoted ? 'animate-bounce' : ''}`} />
              <span>{game.votes}</span>
            </motion.button>
          </div>
        </div>

        {/* Back of card */}
        <div
          className="absolute inset-0 glass rounded-2xl overflow-hidden m-[1px]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {/* Back button */}
          <button
            onClick={handleFlipBack}
            className="absolute top-2 left-2 z-20 w-8 h-8 rounded-full glass-strong flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <HiArrowLeft className="w-4 h-4" />
          </button>

          {/* Top right buttons */}
          <div className="absolute top-2 right-2 z-20 flex gap-1.5">
            {/* Refresh button */}
            <button
              onClick={async (e) => {
                e.stopPropagation()
                if (isRefreshing) return
                setIsRefreshing(true)
                try {
                  await onRefresh(game.id)
                } finally {
                  setIsRefreshing(false)
                }
              }}
              disabled={isRefreshing}
              className="w-8 h-8 rounded-full glass-strong flex items-center justify-center text-white/60 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh game data from Steam"
            >
              <HiRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Steam link */}
            {steamAppId && (
              <a
                href={`https://store.steampowered.com/app/${steamAppId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-full glass-strong flex items-center justify-center text-white/60 hover:text-white transition-colors"
                title="View on Steam"
              >
                <HiExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          <div className="h-full overflow-y-auto scrollbar-hide">
            {/* Screenshots carousel */}
            {detailedGame.screenshots && detailedGame.screenshots.length > 0 && (
              <div className="relative aspect-video overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentScreenshot}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    src={detailedGame.screenshots[currentScreenshot]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Screenshot dots */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {detailedGame.screenshots.slice(0, 6).map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setCurrentScreenshot(i) }}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i === currentScreenshot ? 'bg-white w-3' : 'bg-white/40 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Game details */}
            <div className="p-4 space-y-3">
              <h3 className="font-bold text-white text-lg leading-tight">{detailedGame.title}</h3>

              {/* Meta info row */}
              <div className="flex flex-wrap items-center gap-2">
                <div className={`bg-gradient-to-r ${getPriceBadgeStyle()} px-2 py-0.5 rounded-md text-[11px] font-semibold text-white`}>
                  {detailedGame.price}
                </div>
                {detailedGame.metacritic && (
                  <div
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      detailedGame.metacritic >= 75
                        ? 'bg-emerald-500/60 text-white'
                        : detailedGame.metacritic >= 50
                        ? 'bg-yellow-500/60 text-white'
                        : 'bg-red-500/60 text-white'
                    }`}
                  >
                    {detailedGame.metacritic} Metacritic
                  </div>
                )}
              </div>

              {/* Player Modes */}
              {detailedGame.categories && detailedGame.categories.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <HiUsers className="w-3.5 h-3.5 text-white/40" />
                  {detailedGame.categories
                    .filter(c =>
                      c.includes('player') ||
                      c.includes('Player') ||
                      c.includes('Co-op') ||
                      c.includes('PvP')
                    )
                    .slice(0, 4)
                    .map(cat => (
                      <span
                        key={cat}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                          cat.includes('Co-op') ? 'bg-purple-500/40 text-purple-200' :
                          cat.includes('Multi') ? 'bg-blue-500/40 text-blue-200' :
                          cat.includes('Single') ? 'bg-gray-500/40 text-gray-200' :
                          'bg-amber-500/40 text-amber-200'
                        }`}
                      >
                        {cat}
                      </span>
                    ))}
                </div>
              )}

              {/* Platforms */}
              {detailedGame.platforms && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">Platforms:</span>
                  <div className="flex gap-1.5">
                    {detailedGame.platforms.windows && <FaWindows className="w-3.5 h-3.5 text-white/60" title="Windows" />}
                    {detailedGame.platforms.mac && <FaApple className="w-3.5 h-3.5 text-white/60" title="macOS" />}
                    {detailedGame.platforms.linux && <FaLinux className="w-3.5 h-3.5 text-white/60" title="Linux" />}
                  </div>
                </div>
              )}

              {/* Genres */}
              {detailedGame.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {detailedGame.tags.map(tag => (
                    <span
                      key={tag}
                      className="glass px-2 py-0.5 rounded-md text-[10px] font-medium text-white/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Release date */}
              {detailedGame.release_date && (
                <div className="text-[11px] text-white/40">
                  <span className="uppercase tracking-wider">Released:</span>{' '}
                  <span className="text-white/60">{detailedGame.release_date}</span>
                </div>
              )}

              {/* Developer/Publisher */}
              {(detailedGame.developers || detailedGame.publishers) && (
                <div className="text-[11px] text-white/40 space-y-0.5">
                  {detailedGame.developers && detailedGame.developers.length > 0 && (
                    <div>
                      <span className="uppercase tracking-wider">Developer:</span>{' '}
                      <span className="text-white/60">{detailedGame.developers.join(', ')}</span>
                    </div>
                  )}
                  {detailedGame.publishers && detailedGame.publishers.length > 0 && (
                    <div>
                      <span className="uppercase tracking-wider">Publisher:</span>{' '}
                      <span className="text-white/60">{detailedGame.publishers.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {loadingDetails ? (
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-white/[0.05] animate-pulse" />
                  <div className="h-3 w-3/4 rounded bg-white/[0.05] animate-pulse" />
                  <div className="h-3 w-5/6 rounded bg-white/[0.05] animate-pulse" />
                </div>
              ) : detailedGame.short_description ? (
                <p className="text-[12px] text-white/50 leading-relaxed">
                  {cleanDescription(detailedGame.short_description)}
                </p>
              ) : detailedGame.description ? (
                <p className="text-[12px] text-white/50 leading-relaxed line-clamp-6">
                  {cleanDescription(detailedGame.description)}
                </p>
              ) : null}

              {/* Play trailer button */}
              {detailedGame.trailer_url && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPlayTrailer() }}
                  className="w-full glass glass-hover rounded-lg py-2 text-sm font-medium text-white/70 hover:text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <HiPlay className="w-4 h-4" />
                  Watch Trailer
                </button>
              )}

              {/* Vote button on back */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                animate={justVoted ? { scale: [1, 1.05, 1] } : {}}
                onClick={handleVoteWithAnimation}
                className={`w-full rounded-lg py-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  hasVoted
                    ? 'text-white shadow-lg'
                    : 'glass text-white/50 hover:text-white border border-white/[0.06] hover:border-white/[0.12]'
                } ${justVoted ? 'ring-2 ring-purple-400/50' : ''}`}
                style={
                  hasVoted
                    ? {
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                        boxShadow: justVoted ? '0 4px 25px rgba(139, 92, 246, 0.5)' : '0 4px 15px rgba(139, 92, 246, 0.25)',
                      }
                    : undefined
                }
              >
                <HiThumbUp className={`w-4 h-4 ${hasVoted ? 'text-white' : ''} ${justVoted ? 'animate-bounce' : ''}`} />
                <span>{game.votes} votes</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
