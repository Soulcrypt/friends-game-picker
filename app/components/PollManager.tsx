'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { createPoll, endPoll } from '@/lib/votes'
import type { Poll } from '@/lib/types'
import { HiPlus, HiStop, HiClock, HiX, HiCheck } from 'react-icons/hi'
import { FaDiscord } from 'react-icons/fa'
import toast from 'react-hot-toast'

const MAX_TITLE_LENGTH = 50

interface PollManagerProps {
  activePoll: Poll | null
  onPollCreated: (poll: Poll) => void
  onPollEnded: () => void
}

export default function PollManager({ activePoll, onPollCreated, onPollEnded }: PollManagerProps) {
  const { user, profile, signInWithDiscord } = useAuth()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [title, setTitle] = useState('Game Night Vote')
  const [useEndTime, setUseEndTime] = useState(false)
  const [endTime, setEndTime] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [endingSuccess, setEndingSuccess] = useState(false)

  const isCreator = activePoll && profile && activePoll.created_by === profile.id
  const titleLength = title.trim().length

  const handleCreatePoll = async () => {
    if (!profile || !title.trim() || titleLength > MAX_TITLE_LENGTH) return

    setIsCreating(true)
    try {
      const endsAt = useEndTime && endTime ? new Date(endTime) : undefined
      const poll = await createPoll(title.trim(), profile.id, endsAt)

      if (poll) {
        setShowSuccess(true)
        toast.success('Poll created!')

        // Show success animation before closing
        setTimeout(() => {
          onPollCreated(poll)
          setShowCreateForm(false)
          setTitle('Game Night Vote')
          setUseEndTime(false)
          setEndTime('')
          setShowSuccess(false)
        }, 800)
      } else {
        toast.error('Failed to create poll')
      }
    } catch (error) {
      console.error('Error creating poll:', error)
      toast.error('Failed to create poll')
    } finally {
      setIsCreating(false)
    }
  }

  const handleEndPoll = async () => {
    if (!activePoll) return

    setIsEnding(true)
    try {
      const success = await endPoll(activePoll.id)
      if (success) {
        setEndingSuccess(true)
        toast.success('Poll ended!')
        setTimeout(() => {
          onPollEnded()
          setEndingSuccess(false)
        }, 500)
      } else {
        toast.error('Failed to end poll')
      }
    } catch (error) {
      console.error('Error ending poll:', error)
      toast.error('Failed to end poll')
    } finally {
      setIsEnding(false)
    }
  }

  // Get minimum datetime for end time (now + 5 minutes)
  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 5)
    return now.toISOString().slice(0, 16)
  }

  if (!user || !profile) {
    return (
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-white/80">
              {activePoll ? activePoll.title : 'No active poll'}
            </h3>
            <p className="text-xs text-white/40 mt-1">
              Login with Discord to create or vote in polls
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => signInWithDiscord()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{
              background: '#5865F2',
              boxShadow: '0 4px 15px rgba(88, 101, 242, 0.3)',
            }}
          >
            <FaDiscord className="w-4 h-4" />
            Login
          </motion.button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Active Poll Info or Create Button */}
      {activePoll ? (
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-medium text-white">
                  {activePoll.title}
                </h3>
              </div>
              {activePoll.creator && (
                <p className="text-xs text-white/40 mt-1">
                  Created by {activePoll.creator.discord_username}
                </p>
              )}
              {activePoll.ends_at && (
                <div className="flex items-center gap-1 mt-2 text-xs text-amber-400">
                  <HiClock className="w-3 h-3" />
                  Ends {new Date(activePoll.ends_at).toLocaleString()}
                </div>
              )}
            </div>

            {isCreator && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEndPoll}
                disabled={isEnding || endingSuccess}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 ${
                  endingSuccess
                    ? 'bg-emerald-500'
                    : 'bg-red-500/80 hover:bg-red-500'
                }`}
              >
                <AnimatePresence mode="wait">
                  {isEnding ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1, rotate: 360 }}
                      transition={{ rotate: { duration: 1, repeat: Infinity, ease: 'linear' } }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : endingSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <HiCheck className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <motion.div key="stop" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <HiStop className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
                {isEnding ? 'Ending...' : endingSuccess ? 'Done!' : 'End Poll'}
              </motion.button>
            )}
          </div>
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowCreateForm(true)}
          className="w-full glass glass-hover rounded-xl p-4 text-left transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <HiPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Create New Poll</h3>
              <p className="text-xs text-white/40">Start a ranked-choice vote for game night</p>
            </div>
          </div>
        </motion.button>
      )}

      {/* Create Poll Modal - Apple-style */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-[90%] max-w-sm bg-[#1c1c1e] rounded-xl shadow-2xl overflow-hidden"
            >
              {/* Title */}
              <div className="pt-5 pb-2 px-5">
                <h2 className="text-base font-semibold text-white text-center">New Poll</h2>
              </div>

              {/* Form */}
              <div className="px-5 pb-4 space-y-4">
                {/* Title Input */}
                <div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Poll name"
                    maxLength={MAX_TITLE_LENGTH}
                    autoFocus
                    className="w-full px-3 py-2.5 bg-[#2c2c2e] rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                {/* End time toggle */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-white/80">Set end time</span>
                  <button
                    onClick={() => setUseEndTime(!useEndTime)}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      useEndTime ? 'bg-purple-500' : 'bg-white/20'
                    }`}
                  >
                    <motion.div
                      animate={{ x: useEndTime ? 22 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow"
                    />
                  </button>
                </div>

                {/* End Time Picker */}
                <AnimatePresence>
                  {useEndTime && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        min={getMinDateTime()}
                        className="w-full px-3 py-2.5 bg-[#2c2c2e] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 [color-scheme:dark]"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Scoring hint */}
                <p className="text-xs text-white/40 text-center">
                  Ranked choice: 1st = 3pts, 2nd = 2pts, 3rd = 1pt
                </p>
              </div>

              {/* Actions - iOS style stacked buttons */}
              <div className="border-t border-white/10">
                <button
                  onClick={handleCreatePoll}
                  disabled={isCreating || !title.trim() || showSuccess}
                  className="w-full py-3 text-purple-400 font-medium text-base hover:bg-white/5 disabled:opacity-50 disabled:text-white/30 transition-colors"
                >
                  {isCreating ? 'Creating...' : showSuccess ? 'Created!' : 'Create Poll'}
                </button>
                <div className="border-t border-white/10">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    disabled={isCreating || showSuccess}
                    className="w-full py-3 text-white/60 text-base hover:bg-white/5 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
