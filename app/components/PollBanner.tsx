'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { getActivePoll, calculateResults, getTotalVotersForPoll } from '@/lib/votes'
import type { Poll, Game, GameResult } from '@/lib/types'
import { HiChevronDown, HiChevronUp, HiClock, HiUserGroup, HiCollection } from 'react-icons/hi'
import { HiTrophy } from 'react-icons/hi2'
import PollManager from './PollManager'
import RankedVoting from './RankedVoting'
import PollResults from './PollResults'

// Helper to get countdown urgency class
function getCountdownClass(timeRemaining: string | null): string {
  if (!timeRemaining) return ''
  // Parse time remaining to check urgency
  const match = timeRemaining.match(/^(\d+)([msh])/)
  if (!match) return ''

  const value = parseInt(match[1])
  const unit = match[2]

  // Critical: less than 5 minutes
  if (unit === 's' || (unit === 'm' && value < 5)) {
    return 'countdown-critical'
  }
  // Urgent: less than 30 minutes
  if (unit === 'm' && value < 30) {
    return 'countdown-urgent'
  }
  return ''
}

interface PollBannerProps {
  games: Game[]
  onPollStateChange?: () => void
}

export default function PollBanner({ games, onPollStateChange }: PollBannerProps) {
  const { profile } = useAuth()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [topResults, setTopResults] = useState<GameResult[]>([])
  const [totalVoters, setTotalVoters] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [prevVoterCount, setPrevVoterCount] = useState(0)
  const [voterCountChanged, setVoterCountChanged] = useState(false)

  // Load active poll
  useEffect(() => {
    loadPoll()
  }, [])

  // Update countdown timer
  useEffect(() => {
    if (!poll?.ends_at) {
      setTimeRemaining(null)
      return
    }

    const updateTimer = () => {
      const now = new Date()
      const end = new Date(poll.ends_at!)
      const diff = end.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining('Ended')
        // Refresh poll state
        loadPoll()
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (hours > 24) {
        const days = Math.floor(hours / 24)
        setTimeRemaining(`${days}d ${hours % 24}h`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`)
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`)
      } else {
        setTimeRemaining(`${seconds}s`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [poll?.ends_at])

  // Load top results preview
  useEffect(() => {
    if (!poll || poll.status !== 'active') return

    const loadResults = async () => {
      try {
        const [results, voters] = await Promise.all([
          calculateResults(poll.id),
          getTotalVotersForPoll(poll.id),
        ])
        setTopResults(results.slice(0, 3))

        // Animate voter count change
        if (voters !== totalVoters && totalVoters > 0) {
          setVoterCountChanged(true)
          setTimeout(() => setVoterCountChanged(false), 300)
        }
        setPrevVoterCount(totalVoters)
        setTotalVoters(voters)
      } catch (error) {
        console.error('Error loading results preview:', error)
      }
    }

    loadResults()
    // Refresh every 30 seconds
    const interval = setInterval(loadResults, 30000)
    return () => clearInterval(interval)
  }, [poll?.id, poll?.status])

  const loadPoll = async () => {
    setLoading(true)
    try {
      const activePoll = await getActivePoll()
      setPoll(activePoll)
      if (activePoll?.status === 'ended') {
        setShowResults(true)
      }
    } catch (error) {
      console.error('Error loading poll:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePollCreated = (newPoll: Poll) => {
    setPoll(newPoll)
    setIsExpanded(true)
    setShowResults(false)
    onPollStateChange?.()
  }

  const handlePollEnded = () => {
    // Update the poll status locally instead of reloading (which would return null)
    if (poll) {
      setPoll({ ...poll, status: 'ended' })
    }
    setShowResults(true)
    onPollStateChange?.()
  }

  const handleVoteSubmitted = () => {
    // Refresh results preview
    if (poll) {
      calculateResults(poll.id).then(results => setTopResults(results.slice(0, 3)))
      getTotalVotersForPoll(poll.id).then(setTotalVoters)
    }
    onPollStateChange?.()
  }

  const handleCreateNewPoll = () => {
    setPoll(null)
    setShowResults(false)
    setTopResults([])
    setTotalVoters(0)
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl p-4 mb-6 animate-pulse">
        <div className="h-6 w-48 rounded-lg bg-white/5" />
      </div>
    )
  }

  // Show ended poll results
  if ((poll?.status === 'ended' || showResults) && poll) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4 mb-6"
      >
        <PollResults
          poll={poll}
          onCreateNewPoll={handleCreateNewPoll}
        />
      </motion.div>
    )
  }

  const countdownClass = getCountdownClass(timeRemaining)

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl mb-6 transition-all duration-300 ${
        poll ? 'glass glow-poll-active glow-poll-pulse' : 'glass'
      }`}
    >
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          {poll ? (
            <>
              {/* Active poll indicator */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                <HiTrophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-sm font-semibold text-white">
                    {poll.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                  <span className={`flex items-center gap-1 transition-all ${voterCountChanged ? 'animate-count-up text-purple-400' : ''}`}>
                    <HiUserGroup className="w-3 h-3" />
                    {totalVoters} voter{totalVoters !== 1 ? 's' : ''}
                  </span>
                  {timeRemaining && (
                    <span className={`flex items-center gap-1 ${countdownClass || 'text-amber-400'}`}>
                      <HiClock className={`w-3 h-3 ${countdownClass ? '' : ''}`} />
                      {timeRemaining}
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <HiTrophy className="w-5 h-5 text-white/30" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white/70">
                  No Active Poll
                </h3>
                <p className="text-xs text-white/40">
                  Create a poll to vote on tonight's game
                </p>
              </div>
            </>
          )}
        </div>

        {/* Top 3 Preview (when collapsed) */}
        <div className="flex items-center gap-3">
          {!isExpanded && topResults.length > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              {topResults.slice(0, 3).map((result, i) => (
                <motion.div
                  key={result.game_id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.08, y: -2 }}
                  className="flex items-center gap-1.5 group cursor-default"
                  title={`#${i + 1}: ${result.game?.title} (${result.total_points} pts)`}
                >
                  <span className={`text-xs font-bold ${
                    i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-amber-500'
                  }`}>
                    #{i + 1}
                  </span>
                  {result.game?.cover && (
                    <img
                      src={result.game.cover}
                      alt={result.game.title}
                      className="w-14 h-8 rounded object-cover transition-all group-hover:ring-2 group-hover:ring-purple-500/50 group-hover:shadow-lg"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          )}

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 200 }}
            className="w-8 h-8 rounded-full glass flex items-center justify-center text-white/50"
          >
            <HiChevronDown className="w-5 h-5" />
          </motion.div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-4 pb-6 pt-0 space-y-4">
              {/* Gradient divider */}
              <div className="divider-gradient-strong" />

              {/* Poll Manager (create/end) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="pt-2"
              >
                <PollManager
                  activePoll={poll}
                  onPollCreated={handlePollCreated}
                  onPollEnded={handlePollEnded}
                />
              </motion.div>

              {/* Voting UI */}
              {poll && poll.status === 'active' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="pt-2"
                >
                  <div className="divider-gradient mb-4" />
                  <h4 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Cast Your Vote
                  </h4>
                  <RankedVoting
                    poll={poll}
                    games={games}
                    onVoteSubmitted={handleVoteSubmitted}
                  />
                </motion.div>
              )}

              {/* Live Results Preview */}
              {poll && topResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="pt-2"
                >
                  <div className="divider-gradient mb-4" />
                  <h4 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Current Standings
                  </h4>
                  <div className="space-y-2">
                    {topResults.map((result, i) => (
                      <motion.div
                        key={result.game_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.08 }}
                        whileHover={{ scale: 1.01, x: 4 }}
                        className={`flex items-center gap-3 glass rounded-lg p-2 transition-all cursor-default ${
                          i === 0 ? 'ring-1 ring-yellow-500/20' : ''
                        }`}
                      >
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shadow-lg ${
                          i === 0
                            ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-yellow-500/30'
                            : i === 1
                            ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800'
                            : 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-amber-600/20'
                        }`}>
                          {i + 1}
                        </span>
                        {result.game?.cover && (
                          <img
                            src={result.game.cover}
                            alt={result.game.title}
                            className="w-14 h-8 rounded-lg object-cover"
                          />
                        )}
                        <span className="flex-1 text-sm text-white truncate font-medium">
                          {result.game?.title}
                        </span>
                        <span className={`text-sm font-bold ${
                          i === 0 ? 'text-yellow-400' : 'text-white/70'
                        }`}>
                          {result.total_points} pts
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* View Poll History Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="pt-4"
              >
                <div className="divider-gradient mb-4" />
                <Link
                  href="/polls"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl glass glass-hover text-sm text-white/50 hover:text-white transition-all hover:scale-[1.01]"
                >
                  <HiCollection className="w-4 h-4" />
                  View Poll History
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
