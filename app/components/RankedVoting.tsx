'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { submitRankedVotes, getUserRankedVotes } from '@/lib/votes'
import type { Game, Poll, RankedVote } from '@/lib/types'
import { HiX, HiCheck, HiPlus, HiMenuAlt4 } from 'react-icons/hi'
import { FaDiscord } from 'react-icons/fa'
import toast from 'react-hot-toast'

interface RankedVotingProps {
  poll: Poll
  games: Game[]
  onVoteSubmitted?: () => void
}

interface RankSlot {
  rank: number
  points: number
  label: string
  game: Game | null
  id: string // unique id for reorder
}

export default function RankedVoting({ poll, games, onVoteSubmitted }: RankedVotingProps) {
  const { user, profile, signInWithDiscord } = useAuth()
  const [slots, setSlots] = useState<RankSlot[]>([
    { rank: 1, points: 3, label: '1st Choice', game: null, id: 'slot-1' },
    { rank: 2, points: 2, label: '2nd Choice', game: null, id: 'slot-2' },
    { rank: 3, points: 1, label: '3rd Choice', game: null, id: 'slot-3' },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showGamePicker, setShowGamePicker] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [recentlyAssigned, setRecentlyAssigned] = useState<number | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load existing votes
  useEffect(() => {
    if (!profile || hasLoaded) return

    const loadVotes = async () => {
      try {
        const existingVotes = await getUserRankedVotes(poll.id, profile.id)
        if (existingVotes.length > 0) {
          setSlots(prev => prev.map(slot => {
            const vote = existingVotes.find(v => v.rank === slot.rank)
            if (vote) {
              const game = games.find(g => g.id === vote.game_id)
              return { ...slot, game: game || null }
            }
            return slot
          }))
        }
        setHasLoaded(true)
      } catch (error) {
        console.error('Error loading votes:', error)
        setHasLoaded(true)
      }
    }

    loadVotes()
  }, [poll.id, profile, games, hasLoaded])

  // Handle reorder of slots
  const handleReorder = (newOrder: RankSlot[]) => {
    // Update ranks based on new order
    const updatedSlots = newOrder.map((slot, index) => ({
      ...slot,
      rank: index + 1,
      points: 3 - index,
      label: index === 0 ? '1st Choice' : index === 1 ? '2nd Choice' : '3rd Choice',
    }))
    setSlots(updatedSlots)
  }

  const handleSelectGame = (rank: number, game: Game) => {
    // Check if game is already selected in another slot
    const existingSlot = slots.find(s => s.game?.id === game.id)
    if (existingSlot && existingSlot.rank !== rank) {
      // Remove from existing slot
      setSlots(prev => prev.map(s =>
        s.rank === existingSlot.rank ? { ...s, game: null } : s
      ))
    }

    setSlots(prev => prev.map(s =>
      s.rank === rank ? { ...s, game } : s
    ))
    setShowGamePicker(null)
    setSearchTerm('')

    // Trigger pulse animation
    setRecentlyAssigned(rank)
    setTimeout(() => setRecentlyAssigned(null), 600)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    searchInputRef.current?.focus()
  }

  const handleRemoveGame = (rank: number) => {
    setSlots(prev => prev.map(s =>
      s.rank === rank ? { ...s, game: null } : s
    ))
  }

  const handleSubmit = async () => {
    if (!profile) return

    const rankings = slots
      .filter(s => s.game)
      .map(s => ({ gameId: s.game!.id, rank: s.rank }))

    if (rankings.length === 0) {
      toast.error('Please select at least one game')
      return
    }

    setIsSubmitting(true)
    try {
      const success = await submitRankedVotes(poll.id, profile.id, rankings)
      if (success) {
        toast.success('Vote submitted!')
        onVoteSubmitted?.()
      } else {
        toast.error('Failed to submit vote')
      }
    } catch (error) {
      console.error('Error submitting vote:', error)
      toast.error('Failed to submit vote')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearAll = async () => {
    if (!profile) return

    setIsSubmitting(true)
    try {
      const success = await submitRankedVotes(poll.id, profile.id, [])
      if (success) {
        setSlots(prev => prev.map(s => ({ ...s, game: null })))
        toast.success('Votes cleared')
        onVoteSubmitted?.()
      }
    } catch (error) {
      console.error('Error clearing votes:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedGameIds = slots.filter(s => s.game).map(s => s.game!.id)
  const availableGames = games.filter(g =>
    !selectedGameIds.includes(g.id) &&
    g.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const hasVotes = slots.some(s => s.game)

  if (!user || !profile) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
          <FaDiscord className="w-8 h-8 text-[#5865F2]" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Login to Vote</h3>
        <p className="text-sm text-white/50 mb-4">
          Connect your Discord account to participate in the poll
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => signInWithDiscord()}
          className="px-6 py-3 rounded-xl text-white font-medium"
          style={{
            background: '#5865F2',
            boxShadow: '0 4px 15px rgba(88, 101, 242, 0.3)',
          }}
        >
          Login with Discord
        </motion.button>
      </div>
    )
  }

  const filledSlots = slots.filter(s => s.game).length

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  filledSlots >= i
                    ? 'bg-purple-500 scale-110'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-white/50">
            {filledSlots}/3 choices made
          </span>
        </div>
        {filledSlots > 1 && (
          <span className="text-xs text-white/30">
            Drag to reorder
          </span>
        )}
      </div>

      {/* Rank Slots - Draggable */}
      <Reorder.Group
        axis="y"
        values={slots}
        onReorder={handleReorder}
        className="space-y-3"
      >
        {slots.map((slot) => (
          <Reorder.Item
            key={slot.id}
            value={slot}
            dragListener={!!slot.game && filledSlots > 1}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            whileDrag={{
              scale: 1.02,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              zIndex: 100,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            className={`glass rounded-xl p-3 transition-all ${
              slot.game ? 'ring-1 ring-purple-500/30' : ''
            } ${recentlyAssigned === slot.rank ? 'animate-rank-pulse' : ''} ${
              slot.game && filledSlots > 1 ? 'cursor-grab active:cursor-grabbing' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Drag handle + Rank Badge */}
              <div className="flex items-center gap-2">
                {slot.game && filledSlots > 1 && (
                  <div className="text-white/30 hover:text-white/50 transition-colors">
                    <HiMenuAlt4 className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 transition-all duration-300 ${
                    slot.rank === 1
                      ? 'bg-gradient-to-br from-yellow-500 to-amber-600'
                      : slot.rank === 2
                      ? 'bg-gradient-to-br from-gray-300 to-gray-400'
                      : 'bg-gradient-to-br from-amber-600 to-amber-700'
                  }`}
                >
                  <span className="text-lg font-bold text-white">{slot.rank}</span>
                  <span className="text-xs text-white/80">{slot.points}pts</span>
                </div>
              </div>

              {/* Game Selection */}
              {slot.game ? (
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  {slot.game.cover && (
                    <img
                      src={slot.game.cover}
                      alt={slot.game.title}
                      className="w-16 h-9 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">
                      {slot.game.title}
                    </h4>
                    <p className="text-xs text-white/40 truncate">
                      {slot.game.tags.slice(0, 2).join(', ')}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRemoveGame(slot.rank)}
                    className="w-8 h-8 rounded-full glass flex items-center justify-center text-white/50 hover:text-red-400 transition-colors shrink-0"
                  >
                    <HiX className="w-4 h-4" />
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setShowGamePicker(slot.rank)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-white/10 hover:border-purple-500/40 text-white/40 hover:text-white/70 transition-all group"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="group-hover:scale-110 transition-transform"
                  >
                    <HiPlus className="w-4 h-4" />
                  </motion.div>
                  <span className="text-sm">Select {slot.label}</span>
                </motion.button>
              )}
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {hasVotes && (
          <button
            onClick={handleClearAll}
            disabled={isSubmitting}
            className="px-4 py-3 rounded-xl glass text-white/50 hover:text-white transition-colors disabled:opacity-50"
          >
            Clear
          </button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={isSubmitting || !hasVotes}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-medium disabled:opacity-50 transition-all"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
          }}
        >
          <HiCheck className="w-5 h-5" />
          {isSubmitting ? 'Submitting...' : 'Submit Vote'}
        </motion.button>
      </div>

      {/* Game Picker Modal */}
      <AnimatePresence>
        {showGamePicker !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowGamePicker(null)
              setSearchTerm('')
            }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-lg max-h-[80vh] glass-strong rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-white">
                    Select {slots.find(s => s.rank === showGamePicker)?.label}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowGamePicker(null)
                      setSearchTerm('')
                    }}
                    className="w-8 h-8 rounded-full glass flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  >
                    <HiX className="w-4 h-4" />
                  </motion.button>
                </div>
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search games..."
                    className="w-full px-4 py-2.5 pr-10 rounded-xl glass text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    autoFocus
                  />
                  {searchTerm && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-colors"
                    >
                      <HiX className="w-3 h-3" />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Game List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {availableGames.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    {searchTerm ? 'No games match your search' : 'No more games available'}
                  </div>
                ) : (
                  availableGames.map((game) => (
                    <motion.button
                      key={game.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSelectGame(showGamePicker!, game)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl glass-hover text-left transition-all"
                    >
                      {game.cover ? (
                        <img
                          src={game.cover}
                          alt={game.title}
                          className="w-16 h-9 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-9 rounded-lg bg-white/5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">
                          {game.title}
                        </h4>
                        <p className="text-xs text-white/40 truncate">
                          {game.tags.slice(0, 3).join(' • ')}
                        </p>
                      </div>
                      <div className="text-xs text-white/30">
                        {game.votes} votes
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
