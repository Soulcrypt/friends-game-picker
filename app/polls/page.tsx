'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getPolls, calculateResults } from '@/lib/votes'
import type { Poll, GameResult } from '@/lib/types'
import { HiArrowLeft, HiClock, HiUserGroup, HiCheck } from 'react-icons/hi'
import { HiTrophy } from 'react-icons/hi2'
import LoginButton from '../components/LoginButton'

interface PollWithResults extends Poll {
  results?: GameResult[]
  totalVoters?: number
}

export default function PollsPage() {
  const [polls, setPolls] = useState<PollWithResults[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPoll, setSelectedPoll] = useState<PollWithResults | null>(null)

  useEffect(() => {
    loadPolls()
  }, [])

  const loadPolls = async () => {
    setLoading(true)
    try {
      const pollsData = await getPolls()

      // Load results for each poll
      const pollsWithResults = await Promise.all(
        pollsData.map(async (poll) => {
          const results = await calculateResults(poll.id)
          return {
            ...poll,
            results,
            totalVoters: new Set(results.flatMap(r => r.voters.map(v => v.profile.id))).size,
          }
        })
      )

      setPolls(pollsWithResults)
    } catch (error) {
      console.error('Error loading polls:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="w-10 h-10 rounded-xl glass flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <HiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Poll History</h1>
              <p className="text-sm text-white/50">View past game night votes</p>
            </div>
          </div>
          <LoginButton />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-xl p-4 animate-pulse">
                <div className="h-5 w-48 rounded-lg bg-white/5 mb-2" />
                <div className="h-4 w-32 rounded-lg bg-white/5" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && polls.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <HiTrophy className="w-10 h-10 text-white/20" />
            </div>
            <h2 className="text-lg font-semibold text-white/70 mb-2">No Polls Yet</h2>
            <p className="text-sm text-white/50 mb-6">
              Create your first poll to start voting on games
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
              }}
            >
              <HiArrowLeft className="w-4 h-4" />
              Go Back Home
            </Link>
          </motion.div>
        )}

        {/* Polls List */}
        {!loading && polls.length > 0 && (
          <div className="space-y-4">
            {polls.map((poll, index) => (
              <motion.div
                key={poll.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl overflow-hidden"
              >
                {/* Poll Header */}
                <button
                  onClick={() => setSelectedPoll(selectedPoll?.id === poll.id ? null : poll)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      poll.status === 'active'
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                        : 'bg-gradient-to-br from-purple-500 to-blue-500'
                    }`}>
                      {poll.status === 'active' ? (
                        <HiClock className="w-6 h-6 text-white" />
                      ) : (
                        <HiCheck className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{poll.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                        <span>{formatDate(poll.created_at)}</span>
                        {poll.creator && (
                          <span>by {poll.creator.discord_username}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <HiUserGroup className="w-3 h-3" />
                          {poll.totalVoters || 0} voters
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      poll.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/10 text-white/50'
                    }`}>
                      {poll.status === 'active' ? 'Active' : 'Ended'}
                    </span>
                  </div>
                </button>

                {/* Poll Results (Expanded) */}
                {selectedPoll?.id === poll.id && poll.results && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/[0.06]"
                  >
                    <div className="p-4 space-y-3">
                      {poll.results.length === 0 ? (
                        <div className="text-center py-4 text-white/40 text-sm">
                          No votes were cast in this poll
                        </div>
                      ) : (
                        poll.results.map((result, i) => (
                          <div
                            key={result.game_id}
                            className="flex items-center gap-3 glass rounded-lg p-3"
                          >
                            {/* Rank */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                              i === 0
                                ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white'
                                : i === 1
                                ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800'
                                : i === 2
                                ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                                : 'bg-white/10 text-white/50'
                            }`}>
                              {i + 1}
                            </div>

                            {/* Game Cover */}
                            {result.game?.cover && (
                              <img
                                src={result.game.cover}
                                alt={result.game.title}
                                className="w-14 h-8 rounded object-cover"
                              />
                            )}

                            {/* Game Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-white truncate">
                                {result.game?.title || 'Unknown Game'}
                              </h4>
                              <div className="flex items-center gap-2 text-[10px] text-white/40">
                                <span>{result.first_choice_votes} 1st</span>
                                <span>{result.second_choice_votes} 2nd</span>
                                <span>{result.third_choice_votes} 3rd</span>
                              </div>
                            </div>

                            {/* Points */}
                            <div className="text-right">
                              <div className="text-lg font-bold text-white">{result.total_points}</div>
                              <div className="text-[10px] text-white/40">pts</div>
                            </div>

                            {/* Voter Avatars */}
                            {result.voters.length > 0 && (
                              <div className="flex -space-x-1.5">
                                {result.voters.slice(0, 3).map((voter) => (
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
                                      className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 ring-1 ring-[#08080C] flex items-center justify-center text-[9px] font-bold text-white"
                                      title={voter.profile.discord_username}
                                    >
                                      {voter.profile.discord_username[0].toUpperCase()}
                                    </div>
                                  )
                                ))}
                                {result.voters.length > 3 && (
                                  <div className="w-6 h-6 rounded-full bg-white/10 ring-1 ring-[#08080C] flex items-center justify-center text-[9px] font-medium text-white/60">
                                    +{result.voters.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
