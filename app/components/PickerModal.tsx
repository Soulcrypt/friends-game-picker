'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiX, HiRefresh } from 'react-icons/hi'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import type { Game } from '@/lib/types'

interface PickerModalProps {
  isOpen: boolean
  onClose: () => void
  games: Game[]
}

export default function PickerModal({ isOpen, onClose, games }: PickerModalProps) {
  const focusTrapRef = useFocusTrap(isOpen)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<Game | null>(null)
  const [displayedGame, setDisplayedGame] = useState<Game | null>(null)
  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isOpen && games.length > 0) {
      setDisplayedGame(games[Math.floor(Math.random() * games.length)])
      setWinner(null)
      setIsSpinning(false)
    }
  }, [isOpen, games])

  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const spin = () => {
    if (games.length === 0 || isSpinning) return

    setIsSpinning(true)
    setWinner(null)

    let iterations = 0
    const totalIterations = 30
    let interval = 50

    const cycleGame = () => {
      iterations++
      setDisplayedGame(games[Math.floor(Math.random() * games.length)])

      // Slow down towards the end
      if (iterations > totalIterations * 0.7) {
        interval = 100 + (iterations - totalIterations * 0.7) * 30
      }

      if (iterations >= totalIterations) {
        if (spinIntervalRef.current) {
          clearInterval(spinIntervalRef.current)
        }
        const selected = games[Math.floor(Math.random() * games.length)]
        setDisplayedGame(selected)
        setWinner(selected)
        setIsSpinning(false)
      } else {
        if (spinIntervalRef.current) {
          clearInterval(spinIntervalRef.current)
        }
        spinIntervalRef.current = setInterval(cycleGame, interval)
      }
    }

    spinIntervalRef.current = setInterval(cycleGame, interval)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          ref={focusTrapRef}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Pick For Us"
          className="relative w-full max-w-md glass-strong rounded-2xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full glass flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <HiX className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="p-6 text-center border-b border-white/[0.06]">
            <h2 className="text-xl font-bold text-gradient">Pick For Us</h2>
            <p className="text-sm text-white/40 mt-1">
              {games.length} games in the pool
            </p>
          </div>

          {/* Game display */}
          <div className="p-6">
            <div className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
              isSpinning ? 'animate-pulse' : ''
            } ${winner ? 'ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20' : ''}`}>
              {displayedGame ? (
                <>
                  <div className="aspect-[460/215] bg-white/[0.02]">
                    {displayedGame.cover ? (
                      <img
                        src={displayedGame.cover}
                        alt={displayedGame.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl text-white/10">?</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-white drop-shadow-lg">
                      {displayedGame.title}
                    </h3>
                    {displayedGame.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {displayedGame.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-white/60"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="aspect-[460/215] flex items-center justify-center bg-white/[0.02]">
                  <span className="text-white/20">No games available</span>
                </div>
              )}
            </div>

            {/* Winner announcement */}
            {winner && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center"
              >
                <p className="text-emerald-400 font-semibold">
                  Let&apos;s play this!
                </p>
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 pt-0 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={spin}
              disabled={isSpinning || games.length === 0}
              className="flex-1 py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
              }}
            >
              <HiRefresh className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
              {isSpinning ? 'Spinning...' : winner ? 'Spin Again' : 'Spin!'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
