'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from 'framer-motion'
import { calculateResults, getTotalVotersForPoll } from '@/lib/votes'
import type { Poll, GameResult } from '@/lib/types'
import { HiUserGroup, HiRefresh } from 'react-icons/hi'
import { HiTrophy } from 'react-icons/hi2'
import confetti from 'canvas-confetti'

interface PollResultsProps {
  poll: Poll | null
  onCreateNewPoll?: () => void
}

// Animated counter component
function AnimatedCounter({ value, duration = 1 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const startValue = 0

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.floor(startValue + (value - startValue) * eased)

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return <span>{displayValue}</span>
}

export default function PollResults({ poll, onCreateNewPoll }: PollResultsProps) {
  const [results, setResults] = useState<GameResult[]>([])
  const [totalVoters, setTotalVoters] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [animateResults, setAnimateResults] = useState(false)
  const maxPoints = results.length > 0 ? Math.max(...results.map(r => r.total_points)) : 0

  useEffect(() => {
    if (poll?.id) {
      loadResults()
    }
  }, [poll?.id])

  useEffect(() => {
    if (results.length > 0 && !showConfetti) {
      setShowConfetti(true)
      // Trigger confetti for the winner with enhanced effect
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.3 },
        colors: ['#FFD700', '#FFA500', '#8B5CF6', '#3B82F6', '#10B981'],
        ticks: 150,
      })

      // Second burst for more impact
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 100,
          origin: { y: 0.4, x: 0.3 },
          colors: ['#FFD700', '#FFA500'],
        })
        confetti({
          particleCount: 50,
          spread: 100,
          origin: { y: 0.4, x: 0.7 },
          colors: ['#8B5CF6', '#3B82F6'],
        })
      }, 200)

      // Start count animations
      setTimeout(() => setAnimateResults(true), 100)
    }
  }, [results, showConfetti])

  const loadResults = async () => {
    if (!poll) return

    setLoading(true)
    try {
      const [gameResults, voterCount] = await Promise.all([
        calculateResults(poll.id),
        getTotalVotersForPoll(poll.id),
      ])
      setResults(gameResults)
      setTotalVoters(voterCount)
    } catch (error) {
      console.error('Error loading results:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          badge: 'bg-gradient-to-br from-yellow-400 to-amber-500',
          glow: 'glow-winner',
          border: 'ring-2 ring-yellow-500/40',
          textColor: 'text-yellow-400',
        }
      case 2:
        return {
          badge: 'bg-gradient-to-br from-gray-300 to-gray-400',
          glow: 'shadow-[0_0_20px_rgba(192,192,192,0.15)]',
          border: 'ring-1 ring-gray-400/30',
          textColor: 'text-gray-300',
        }
      case 3:
        return {
          badge: 'bg-gradient-to-br from-amber-600 to-amber-700',
          glow: 'shadow-[0_0_15px_rgba(217,119,6,0.15)]',
          border: 'ring-1 ring-amber-600/30',
          textColor: 'text-amber-500',
        }
      default:
        return {
          badge: 'bg-white/10',
          glow: '',
          border: '',
          textColor: 'text-white/70',
        }
    }
  }

  if (!poll) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <p className="text-white/50">No poll data available</p>
        {onCreateNewPoll && (
          <button
            onClick={onCreateNewPoll}
            className="mt-4 px-4 py-2 rounded-xl glass text-white/70 hover:text-white transition-colors"
          >
            Create New Poll
          </button>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-center gap-3 text-white/50">
          <HiRefresh className="w-5 h-5 animate-spin" />
          Loading results...
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
          <HiTrophy className="w-8 h-8 text-white/20" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Votes Yet</h3>
        <p className="text-sm text-white/50">
          This poll ended without any votes
        </p>
      </div>
    )
  }

  const winner = results[0]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{poll.title}</h3>
          <p className="text-sm text-white/50">Poll Results</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/50">
          <HiUserGroup className="w-4 h-4" />
          {totalVoters} voter{totalVoters !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Winner Highlight */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={`glass rounded-2xl p-4 ${getRankStyle(1).glow} ${getRankStyle(1).border} animate-winner-reveal`}
      >
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className={`w-14 h-14 rounded-xl ${getRankStyle(1).badge} flex items-center justify-center shrink-0 shadow-lg shadow-yellow-500/30`}
          >
            <HiTrophy className="w-7 h-7 text-white" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 mb-1"
            >
              <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                Winner
              </span>
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            </motion.div>
            <h4 className="text-lg font-bold text-white truncate">
              {winner.game?.title || 'Unknown Game'}
            </h4>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-lg font-bold text-yellow-400">
                {animateResults ? <AnimatedCounter value={winner.total_points} duration={0.8} /> : winner.total_points} points
              </span>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300">{winner.first_choice_votes} 1st</span>
                <span className="px-1.5 py-0.5 rounded bg-gray-400/20 text-gray-300">{winner.second_choice_votes} 2nd</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-600/20 text-amber-400">{winner.third_choice_votes} 3rd</span>
              </div>
            </div>
          </div>
          {winner.game?.cover && (
            <motion.img
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              src={winner.game.cover}
              alt={winner.game.title}
              className="w-24 h-14 rounded-lg object-cover shrink-0 ring-2 ring-yellow-500/30"
            />
          )}
        </div>

        {/* Voter avatars */}
        {winner.voters.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">Voted by:</span>
              <div className="flex -space-x-2">
                {winner.voters.slice(0, 8).map((voter, i) => (
                  <div
                    key={voter.profile.id}
                    className="relative"
                    title={`${voter.profile.discord_username} (${voter.rank === 1 ? '1st' : voter.rank === 2 ? '2nd' : '3rd'} choice)`}
                  >
                    {voter.profile.avatar_url ? (
                      <img
                        src={voter.profile.avatar_url}
                        alt={voter.profile.discord_username}
                        className={`w-7 h-7 rounded-full ring-2 ring-[#08080C] ${
                          voter.rank === 1 ? 'ring-yellow-500/50' : ''
                        }`}
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 ring-2 ring-[#08080C] flex items-center justify-center text-xs font-bold text-white">
                        {voter.profile.discord_username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
                {winner.voters.length > 8 && (
                  <div className="w-7 h-7 rounded-full bg-white/10 ring-2 ring-[#08080C] flex items-center justify-center text-xs font-medium text-white/60">
                    +{winner.voters.length - 8}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Other Results */}
      <div className="space-y-2">
        {results.slice(1).map((result, index) => {
          const rank = index + 2
          const style = getRankStyle(rank)
          const progressPercent = maxPoints > 0 ? (result.total_points / maxPoints) * 100 : 0

          return (
            <motion.div
              key={result.game_id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className={`glass rounded-xl p-3 ${style.border} ${style.glow} relative overflow-hidden`}
            >
              {/* Progress bar background */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                className={`absolute inset-y-0 left-0 ${
                  rank === 2 ? 'bg-gray-400/10' : rank === 3 ? 'bg-amber-600/10' : 'bg-white/5'
                }`}
              />

              <div className="flex items-center gap-3 relative z-10">
                {/* Rank Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, type: 'spring' }}
                  className={`w-10 h-10 rounded-lg ${style.badge} flex items-center justify-center shrink-0 shadow-lg`}
                >
                  <span className={`text-lg font-bold ${rank === 2 ? 'text-gray-800' : 'text-white'}`}>{rank}</span>
                </motion.div>

                {/* Game Cover */}
                {result.game?.cover && (
                  <img
                    src={result.game.cover}
                    alt={result.game.title}
                    className={`w-14 h-8 rounded-lg object-cover shrink-0 ${
                      rank === 2 ? 'ring-1 ring-gray-400/30' : rank === 3 ? 'ring-1 ring-amber-600/30' : ''
                    }`}
                  />
                )}

                {/* Game Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white truncate">
                    {result.game?.title || 'Unknown Game'}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-white/40 mt-0.5">
                    <span className="px-1 py-0.5 rounded bg-yellow-500/10 text-yellow-400/70">{result.first_choice_votes}</span>
                    <span className="px-1 py-0.5 rounded bg-gray-400/10 text-gray-400/70">{result.second_choice_votes}</span>
                    <span className="px-1 py-0.5 rounded bg-amber-600/10 text-amber-500/70">{result.third_choice_votes}</span>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right shrink-0">
                  <div className={`text-lg font-bold ${style.textColor}`}>
                    {animateResults ? <AnimatedCounter value={result.total_points} duration={0.8 + index * 0.1} /> : result.total_points}
                  </div>
                  <div className="text-xs text-white/40">points</div>
                </div>

                {/* Voter Avatars */}
                {result.voters.length > 0 && (
                  <div className="flex -space-x-1.5 shrink-0">
                    {result.voters.slice(0, 4).map((voter) => (
                      voter.profile.avatar_url ? (
                        <img
                          key={voter.profile.id}
                          src={voter.profile.avatar_url}
                          alt={voter.profile.discord_username}
                          className="w-6 h-6 rounded-full ring-1 ring-[#08080C]"
                          title={voter.profile.discord_username}
                        />
                      ) : (
                        <div
                          key={voter.profile.id}
                          className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 ring-1 ring-[#08080C] flex items-center justify-center text-xs font-bold text-white"
                          title={voter.profile.discord_username}
                        >
                          {voter.profile.discord_username[0].toUpperCase()}
                        </div>
                      )
                    ))}
                    {result.voters.length > 4 && (
                      <div className="w-6 h-6 rounded-full bg-white/10 ring-1 ring-[#08080C] flex items-center justify-center text-xs font-medium text-white/60">
                        +{result.voters.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Create New Poll Button */}
      {onCreateNewPoll && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateNewPoll}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl glass glass-hover text-white/70 hover:text-white transition-all"
        >
          <HiRefresh className="w-5 h-5" />
          Start New Poll
        </motion.button>
      )}
    </div>
  )
}
