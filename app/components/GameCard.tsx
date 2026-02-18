'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiThumbUp, HiTrash, HiPlay, HiArrowLeft, HiExternalLink, HiUsers, HiRefresh, HiInformationCircle, HiStar, HiHeart, HiX, HiCheck } from 'react-icons/hi'
import { HiTrophy } from 'react-icons/hi2'
import { FaWindows, FaApple, FaLinux, FaSteam } from 'react-icons/fa'
import { SiEpicgames, SiGogdotcom } from 'react-icons/si'
import { FaXbox } from 'react-icons/fa'
import { TbWorldWww } from 'react-icons/tb'
import confetti from 'canvas-confetti'
import type { Game, ReactionType, ReactionCounts, GameSource } from '@/lib/types'
import { getSessionId, getReactions, getUserReactions, toggleReaction } from '@/lib/votes'
import { fetchGameDetails } from '@/lib/steam'
import ReactionButtons from './ReactionButtons'
import ScreenshotSlideshow from './ScreenshotSlideshow'

import type { CardSize } from '@/lib/types'

// Helper to detect YouTube URLs
function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

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
function getSourceStyles(source: GameSource): { bg: string; text: string; name: string } {
  switch (source) {
    case 'steam':
      return { bg: 'bg-[#1B2838]', text: 'text-[#66C0F4]', name: 'Steam' }
    case 'epic':
      return { bg: 'bg-[#2A2A2A]', text: 'text-white', name: 'Epic' }
    case 'gog':
      return { bg: 'bg-[#86328A]', text: 'text-white', name: 'GOG' }
    case 'xbox':
      return { bg: 'bg-[#107C10]', text: 'text-white', name: 'Xbox' }
    case 'igdb':
      return { bg: 'bg-purple-900/50', text: 'text-purple-300', name: 'IGDB' }
    default:
      return { bg: 'bg-white/10', text: 'text-white/70', name: 'Other' }
  }
}

interface GameCardProps {
  game: Game
  onVote: () => void
  onRemove: () => void
  onPlayTrailer: () => void
  onRefresh: (gameId: string) => Promise<void>
  onPin?: () => void
  onPollRankSelect?: (gameId: string, rank: number | null) => void
  rank: number
  index: number
  hasVoted: boolean
  isPinned?: boolean
  size?: CardSize
  pollRank?: number | null // 1, 2, or 3 if user ranked this game in active poll
  pollVoteCount?: number // total votes this game received in active poll
  isPollActive?: boolean // whether there's an active poll
  userPollRanks?: { [rank: number]: string } // rank -> gameId mapping for current user
}

export default function GameCard({ game, onVote, onRemove, onPlayTrailer, onRefresh, onPin, onPollRankSelect, rank, index, hasVoted, isPinned = false, size = 'medium', pollRank, pollVoteCount, isPollActive = false, userPollRanks = {} }: GameCardProps) {
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
  const [showRankSelector, setShowRankSelector] = useState(false)
  const [rankJustAssigned, setRankJustAssigned] = useState(false)
  const [showHeartBurst, setShowHeartBurst] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const quickActionsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 640px)').matches)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  // Mobile touch handlers for screenshot navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isFlipped) return
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
  }, [isFlipped])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isFlipped || !touchStartRef.current || !detailedGame.screenshots?.length) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time

    // Swipe detection: horizontal swipe, short duration, more horizontal than vertical
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) && deltaTime < 300) {
      const maxScreenshot = Math.min(detailedGame.screenshots.length - 1, 5)
      if (deltaX < 0) {
        // Swipe left - next screenshot
        setCurrentScreenshot(prev => Math.min(prev + 1, maxScreenshot))
      } else {
        // Swipe right - previous screenshot
        setCurrentScreenshot(prev => Math.max(prev - 1, 0))
      }
    }

    touchStartRef.current = null
  }, [isFlipped, detailedGame.screenshots])

  // Mobile tap handler to show quick actions
  const handleMobileTap = useCallback((e: React.MouseEvent) => {
    if (!isMobile || isFlipped) return
    // Toggle quick actions on mobile tap
    if (!showQuickActions) {
      e.preventDefault()
      e.stopPropagation()
      setShowQuickActions(true)
      // Auto-hide after 3 seconds
      setTimeout(() => setShowQuickActions(false), 3000)
    }
  }, [isMobile, isFlipped, showQuickActions])

  // Vote with confetti animation
  const handleVoteWithAnimation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()

    // Trigger confetti if this is a new vote
    if (!hasVoted && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      const x = (rect.left + rect.width / 2) / window.innerWidth
      const y = (rect.top + rect.height / 2) / window.innerHeight

      // Smaller particle burst for interest button
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { x, y },
        colors: ['#EC4899', '#F43F5E', '#F97316'],
        ticks: 80,
        gravity: 1.5,
        scalar: 0.6,
        shapes: ['circle'],
      })

      setJustVoted(true)
      setShowHeartBurst(true)
      setTimeout(() => setJustVoted(false), 600)
      setTimeout(() => setShowHeartBurst(false), 500)
    }

    onVote()
  }, [hasVoted, onVote])

  // Handle rank selection with animation
  const handleRankSelect = useCallback((gameId: string, rank: number | null) => {
    if (onPollRankSelect) {
      onPollRankSelect(gameId, rank)
      if (rank !== null) {
        setRankJustAssigned(true)
        setTimeout(() => setRankJustAssigned(false), 600)
      }
      setShowRankSelector(false)
    }
  }, [onPollRankSelect])

  // Use steam_appid or rawg_id (both store Steam app ID)
  const steamAppId = game.steam_appid || game.rawg_id

  const handleCardClick = async () => {
    if (!isFlipped) {
      setIsFlipped(true)
      // Fetch full details if we don't have them
      if (!detailedGame.description) {
        setLoadingDetails(true)
        try {
          if (steamAppId) {
            // Fetch from Steam
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
          } else if (game.igdb_id) {
            // Fetch from IGDB for non-Steam games
            const response = await fetch(`/api/igdb/details?id=${game.igdb_id}`)
            if (response.ok) {
              const details = await response.json()
              setDetailedGame(prev => ({
                ...prev,
                description: details.description || details.summary,
                short_description: details.summary,
                screenshots: details.screenshots || prev.screenshots,
                trailer_url: details.trailerUrl || prev.trailer_url,
                release_date: details.releaseDate,
                developers: details.developers,
                publishers: details.publishers,
              }))
            }
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
  // Don't try to autoplay YouTube URLs in video tag - they won't work
  const hasDirectVideoTrailer = hasTrailer && !isYouTubeUrl(game.trailer_url!)
  const showVideo = hasDirectVideoTrailer && isHovered && !videoError && !isFlipped
  // Show screenshots slideshow for YouTube trailers or if no trailer but has screenshots
  const showScreenshots = ((!hasDirectVideoTrailer && hasScreenshots) || (!hasTrailer && hasScreenshots)) && isHovered && !isFlipped

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
      whileTap={isMobile && !isFlipped ? { scale: 0.98 } : undefined}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: Math.min(index * 0.04, 0.4),
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={isMobile && !isFlipped && !showQuickActions ? handleMobileTap : undefined}
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
                aria-label={isPinned ? `Unpin ${game.title}` : `Pin ${game.title} to top`}
                aria-pressed={isPinned}
              >
                <HiStar className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} aria-hidden="true" />
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
              aria-label={`Remove ${game.title} from list`}
            >
              <HiTrash className="w-4 h-4" aria-hidden="true" />
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

          {/* Poll rank badge - shows when user has ranked this game */}
          {pollRank && (
            <div
              className={`absolute top-2 ${rankBadge ? 'right-12' : 'right-2'} z-10 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold shadow-lg ${
                pollRank === 1
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white'
                  : pollRank === 2
                  ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800'
                  : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white'
              }`}
              title={`Your ${pollRank === 1 ? '1st' : pollRank === 2 ? '2nd' : '3rd'} choice`}
            >
              <HiStar className="w-3 h-3" />
              {pollRank === 1 ? '1st' : pollRank === 2 ? '2nd' : '3rd'}
            </div>
          )}

          {/* Cover area */}
          <div className="relative aspect-[460/215] overflow-hidden bg-surface-raised">
            {/* Image loading skeleton with shimmer */}
            {imgLoading && showCover && (
              <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/10 via-accent-blue/10 to-accent-cyan/10">
                <div className="absolute inset-0 animate-shimmer" />
              </div>
            )}

            {showCover ? (
              <img
                src={game.cover}
                alt={game.title}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-standard group-hover:scale-105 ${
                  imgLoading ? 'opacity-0 scale-105 blur-sm' : 'opacity-100 scale-100 blur-0'
                }`}
                style={{ opacity: (showVideo && videoReady) || showScreenshots ? 0 : imgLoading ? 0 : 1 }}
                onLoad={() => setImgLoading(false)}
                onError={() => { setImgFailed(true); setImgLoading(false) }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02] flex flex-col items-center justify-center gap-2 p-4">
                <span className="text-3xl text-white/10">?</span>
                <span className="text-xs text-white/30 text-center leading-tight truncate w-full">
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
                    aria-label={hasVoted ? `Remove vote from ${game.title}` : `Vote for ${game.title}`}
                    aria-pressed={hasVoted}
                  >
                    <HiThumbUp className="w-5 h-5" aria-hidden="true" />
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
                      aria-label={`Watch ${game.title} trailer`}
                    >
                      <HiPlay className="w-5 h-5 ml-0.5" aria-hidden="true" />
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
                    aria-label={`View details for ${game.title}`}
                  >
                    <HiInformationCircle className="w-5 h-5" aria-hidden="true" />
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
                      aria-label={`View ${game.title} on Steam store`}
                    >
                      <FaSteam className="w-5 h-5" aria-hidden="true" />
                    </motion.a>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className={`bg-gradient-to-r ${getPriceBadgeStyle()} backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-white`}>
                  {game.price}
                </div>
                {game.metacritic && (
                  <div
                    className={`backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold ${
                      game.metacritic >= 75
                        ? 'bg-emerald-500/50 text-emerald-100'
                        : game.metacritic >= 50
                        ? 'bg-amber-500/50 text-amber-100'
                        : 'bg-red-500/50 text-red-100'
                    }`}
                  >
                    {game.metacritic}
                  </div>
                )}
                {/* Platform icons */}
                {game.platforms && (
                  <div className="flex items-center gap-1 backdrop-blur-sm bg-black/50 px-2 py-1 rounded-md">
                    {game.platforms.windows && <FaWindows className="w-3 h-3 text-white/70" title="Windows" />}
                    {game.platforms.mac && <FaApple className="w-3 h-3 text-white/70" title="macOS" />}
                    {game.platforms.linux && <FaLinux className="w-3 h-3 text-white/70" title="Linux" />}
                  </div>
                )}
                {/* Store availability badges */}
                <div className="flex items-center gap-1">
                  {game.steam_appid && (
                    <a
                      href={`https://store.steampowered.com/app/${game.steam_appid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="backdrop-blur-sm bg-white/10 hover:bg-white/20 p-1.5 rounded transition-colors"
                      title="View on Steam"
                      aria-label="View on Steam"
                    >
                      <FaSteam className="w-3 h-3 text-white/80" />
                    </a>
                  )}
                  {game.epic_id && (
                    <a
                      href={`https://store.epicgames.com/p/${game.epic_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="backdrop-blur-sm bg-white/10 hover:bg-white/20 p-1.5 rounded transition-colors"
                      title="View on Epic Games"
                      aria-label="View on Epic Games"
                    >
                      <SiEpicgames className="w-3 h-3 text-white/80" />
                    </a>
                  )}
                  {game.gog_id && (
                    <a
                      href={`https://www.gog.com/game/${game.gog_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="backdrop-blur-sm bg-white/10 hover:bg-white/20 p-1.5 rounded transition-colors"
                      title="View on GOG"
                      aria-label="View on GOG"
                    >
                      <SiGogdotcom className="w-3 h-3 text-white/80" />
                    </a>
                  )}
                  {game.xbox_id && (
                    <a
                      href={`https://www.xbox.com/games/store/${game.xbox_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="backdrop-blur-sm bg-white/10 hover:bg-white/20 p-1.5 rounded transition-colors"
                      title="View on Xbox"
                      aria-label="View on Xbox"
                    >
                      <FaXbox className="w-3 h-3 text-white/80" />
                    </a>
                  )}
                </div>
                {/* Game Pass badge */}
                {game.platform_availability?.xbox?.gamePass && (
                  <div className="backdrop-blur-sm bg-emerald-600/60 px-2 py-1 rounded-md flex items-center gap-1">
                    <FaXbox className="w-3 h-3 text-white" />
                    <span className="text-xs font-medium text-white">Game Pass</span>
                  </div>
                )}
                {/* Early Access badge */}
                {game.categories?.some(c => c.toLowerCase().includes('early access')) && (
                  <div className="backdrop-blur-sm bg-amber-500/50 px-2 py-1 rounded-md text-xs font-medium text-amber-100">
                    Early Access
                  </div>
                )}
                {game.categories?.some(c => c.includes('Co-op')) && (
                  <div className="backdrop-blur-sm bg-purple-500/50 px-2 py-1 rounded-md text-xs font-medium text-purple-100">
                    Co-op
                  </div>
                )}
                {game.categories?.some(c => c.includes('Multi-player')) && !game.categories?.some(c => c.includes('Co-op')) && (
                  <div className="backdrop-blur-sm bg-blue-500/50 px-2 py-1 rounded-md text-xs font-medium text-blue-100">
                    MP
                  </div>
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-sm text-white line-clamp-2 leading-snug drop-shadow-lg flex-1">
                  {game.title}
                </h3>
                {/* Primary source badge */}
                {game.primary_source && game.primary_source !== 'steam' && (
                  <div className={`flex-shrink-0 backdrop-blur-sm ${getSourceStyles(game.primary_source).bg} px-2 py-1 rounded flex items-center gap-1`}>
                    <SourceIcon source={game.primary_source} className="w-3 h-3" />
                    <span className={`text-xs font-medium ${getSourceStyles(game.primary_source).text}`}>
                      {getSourceStyles(game.primary_source).name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Player modes - prominent display */}
            {game.categories && game.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
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
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                        cat.includes('Co-op') ? 'bg-purple-500/20 text-purple-300' :
                        cat.includes('Multi') ? 'bg-blue-500/20 text-blue-300' :
                        cat === 'Single-player' ? 'bg-white/10 text-white/60' :
                        'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      <HiUsers className="w-3 h-3" />
                      {cat}
                    </span>
                  ))}
              </div>
            )}

            {/* Genre tags */}
            <div className="flex flex-wrap gap-1.5">
              {game.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="glass px-2 py-1 rounded-md text-xs font-medium text-white/50"
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

            {/* Poll voting section - when poll is active */}
            {isPollActive && onPollRankSelect && (
              <div className="space-y-2">
                {/* Show current rank if ranked */}
                {pollRank ? (
                  <motion.div
                    initial={rankJustAssigned ? { scale: 0.9, opacity: 0 } : false}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`flex items-center gap-2 ${rankJustAssigned ? 'animate-rank-pulse' : ''}`}
                  >
                    <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      pollRank === 1 ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30' :
                      pollRank === 2 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/30' :
                      'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border border-amber-600/30'
                    }`}>
                      <HiTrophy className={`w-4 h-4 ${
                        pollRank === 1 ? 'text-yellow-400' :
                        pollRank === 2 ? 'text-gray-300' :
                        'text-amber-500'
                      }`} />
                      <span className="text-sm font-semibold text-white">
                        Your {pollRank === 1 ? '1st' : pollRank === 2 ? '2nd' : '3rd'} Choice
                      </span>
                      <span className="text-xs text-white/50 ml-auto">
                        {pollRank === 1 ? '3' : pollRank === 2 ? '2' : '1'} pts
                      </span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); handleRankSelect(game.id, null) }}
                      className="w-8 h-8 rounded-lg glass flex items-center justify-center text-white/50 hover:text-red-400 transition-colors"
                      title="Remove from poll"
                    >
                      <HiX className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                ) : (
                  /* Rank selector for unranked games */
                  <AnimatePresence mode="wait">
                    {showRankSelector ? (
                      <motion.div
                        key="selector"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
                        className="flex items-center gap-2 overflow-hidden"
                      >
                        {[1, 2, 3].map((r, index) => {
                          const isOccupied = !!(userPollRanks[r] && userPollRanks[r] !== game.id)
                          return (
                            <motion.button
                              key={r}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 20 }}
                              whileHover={!isOccupied ? { scale: 1.08, y: -2 } : {}}
                              whileTap={!isOccupied ? { scale: 0.95 } : {}}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRankSelect(game.id, r)
                              }}
                              disabled={isOccupied}
                              className={`relative flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                isOccupied
                                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                  : r === 1
                                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40'
                                  : r === 2
                                  ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 shadow-lg hover:shadow-gray-400/30'
                                  : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/20 hover:shadow-amber-600/30'
                              }`}
                              title={isOccupied ? `Replaces existing choice` : `${r === 1 ? '3' : r === 2 ? '2' : '1'} points`}
                            >
                              {r === 1 ? '1st' : r === 2 ? '2nd' : '3rd'}
                              {isOccupied && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 text-[8px] flex items-center justify-center">!</span>
                              )}
                            </motion.button>
                          )
                        })}
                        <motion.button
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.15 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); setShowRankSelector(false) }}
                          className="w-8 h-8 rounded-lg glass flex items-center justify-center text-white/50 hover:text-white transition-colors"
                        >
                          <HiX className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.button
                        key="add-button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => { e.stopPropagation(); setShowRankSelector(true) }}
                        className="w-full rounded-lg py-2.5 text-sm font-medium glass text-purple-300 hover:text-purple-200 border border-purple-500/20 hover:border-purple-500/40 transition-all flex items-center justify-center gap-2 group"
                      >
                        <HiTrophy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Add to Poll
                      </motion.button>
                    )}
                  </AnimatePresence>
                )}

                {/* Show poll points if game has votes */}
                {pollVoteCount !== undefined && pollVoteCount > 0 && (
                  <div className="flex items-center justify-center gap-2 text-xs text-white/40">
                    <span>{pollVoteCount} poll points</span>
                  </div>
                )}
              </div>
            )}

            {/* Interest button - when no poll active */}
            {!isPollActive && (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleVoteWithAnimation}
                  className={`w-full rounded-lg py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2 relative overflow-hidden ${
                    hasVoted
                      ? 'text-white shadow-lg'
                      : 'glass text-white/50 hover:text-white border border-white/[0.06] hover:border-white/[0.12]'
                  } ${justVoted ? 'ring-2 ring-pink-400/50' : ''}`}
                  style={
                    hasVoted
                      ? {
                          background: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
                          boxShadow: justVoted ? '0 4px 25px rgba(236, 72, 153, 0.5)' : '0 4px 15px rgba(236, 72, 153, 0.25)',
                        }
                      : undefined
                  }
                >
                  <span className="relative">
                    <HiHeart
                      className={`w-4 h-4 transition-all duration-300 ${
                        hasVoted ? 'text-white fill-current' : ''
                      } ${justVoted ? 'animate-heart-fill' : ''}`}
                    />
                    {/* Burst effect */}
                    {showHeartBurst && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="absolute w-4 h-4 rounded-full bg-pink-400/60 animate-heart-burst" />
                      </span>
                    )}
                  </span>
                  <span className={`transition-all ${justVoted ? 'animate-count-up' : ''}`}>
                    {game.votes} interested
                  </span>
                </motion.button>
              </div>
            )}
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
            aria-label="Go back to card front"
          >
            <HiArrowLeft className="w-4 h-4" aria-hidden="true" />
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
              title="Refresh game data"
              aria-label={`Refresh ${game.title} data`}
            >
              <HiRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
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
                aria-label={`Open ${game.title} on Steam store`}
              >
                <HiExternalLink className="w-4 h-4" aria-hidden="true" />
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
              <h3 className="font-semibold text-white text-base leading-tight">{detailedGame.title}</h3>

              {/* Meta info row */}
              <div className="flex flex-wrap items-center gap-2">
                <div className={`bg-gradient-to-r ${getPriceBadgeStyle()} px-2 py-1 rounded-md text-xs font-medium text-white`}>
                  {detailedGame.price}
                </div>
                {detailedGame.metacritic && (
                  <div
                    className={`px-2 py-1 rounded-md text-xs font-semibold ${
                      detailedGame.metacritic >= 75
                        ? 'bg-emerald-500/50 text-emerald-100'
                        : detailedGame.metacritic >= 50
                        ? 'bg-amber-500/50 text-amber-100'
                        : 'bg-red-500/50 text-red-100'
                    }`}
                  >
                    {detailedGame.metacritic} Metacritic
                  </div>
                )}
              </div>

              {/* Player Modes */}
              {detailedGame.categories && detailedGame.categories.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <HiUsers className="w-3.5 h-3.5 text-white/50" />
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
                        className={`px-2 py-1 rounded-md text-xs font-medium ${
                          cat.includes('Co-op') ? 'bg-purple-500/30 text-purple-200' :
                          cat.includes('Multi') ? 'bg-blue-500/30 text-blue-200' :
                          cat.includes('Single') ? 'bg-white/10 text-white/60' :
                          'bg-amber-500/30 text-amber-200'
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
                  <span className="text-xs text-white/50 uppercase tracking-wide">Platforms:</span>
                  <div className="flex gap-2">
                    {detailedGame.platforms.windows && <FaWindows className="w-4 h-4 text-white/60" title="Windows" />}
                    {detailedGame.platforms.mac && <FaApple className="w-4 h-4 text-white/60" title="macOS" />}
                    {detailedGame.platforms.linux && <FaLinux className="w-4 h-4 text-white/60" title="Linux" />}
                  </div>
                </div>
              )}

              {/* Genres */}
              {detailedGame.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {detailedGame.tags.map(tag => (
                    <span
                      key={tag}
                      className="glass px-2 py-1 rounded-md text-xs font-medium text-white/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Release date */}
              {detailedGame.release_date && (
                <div className="text-xs text-white/50">
                  <span className="uppercase tracking-wide">Released:</span>{' '}
                  <span className="text-white/70">{detailedGame.release_date}</span>
                </div>
              )}

              {/* Developer/Publisher */}
              {(detailedGame.developers || detailedGame.publishers) && (
                <div className="text-xs text-white/50 space-y-1">
                  {detailedGame.developers && detailedGame.developers.length > 0 && (
                    <div>
                      <span className="uppercase tracking-wide">Developer:</span>{' '}
                      <span className="text-white/70">{detailedGame.developers.join(', ')}</span>
                    </div>
                  )}
                  {detailedGame.publishers && detailedGame.publishers.length > 0 && (
                    <div>
                      <span className="uppercase tracking-wide">Publisher:</span>{' '}
                      <span className="text-white/70">{detailedGame.publishers.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {loadingDetails ? (
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-white/5 animate-shimmer" />
                  <div className="h-3 w-3/4 rounded bg-white/5 animate-shimmer" />
                  <div className="h-3 w-5/6 rounded bg-white/5 animate-shimmer" />
                </div>
              ) : detailedGame.short_description ? (
                <p className="text-sm text-white/60 leading-relaxed">
                  {cleanDescription(detailedGame.short_description)}
                </p>
              ) : detailedGame.description ? (
                <p className="text-sm text-white/60 leading-relaxed line-clamp-6">
                  {cleanDescription(detailedGame.description)}
                </p>
              ) : null}

              {/* Play trailer button */}
              {detailedGame.trailer_url && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPlayTrailer() }}
                  className="w-full btn-secondary rounded-xl py-3 text-sm flex items-center justify-center gap-2"
                >
                  <HiPlay className="w-4 h-4" />
                  Watch Trailer
                </button>
              )}

              {/* Vote button on back */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleVoteWithAnimation}
                className={`w-full rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                  hasVoted
                    ? 'btn-primary'
                    : 'btn-secondary'
                } ${justVoted ? 'animate-pop' : ''}`}
              >
                <HiThumbUp className={`w-4 h-4 ${justVoted ? 'animate-count' : ''}`} />
                <span>{game.votes} votes</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
