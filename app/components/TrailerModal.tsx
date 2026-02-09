'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiX, HiExternalLink } from 'react-icons/hi'

interface TrailerModalProps {
  isOpen: boolean
  onClose: () => void
  trailerUrl: string
  gameTitle: string
}

export default function TrailerModal({ isOpen, onClose, trailerUrl, gameTitle }: TrailerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoError, setVideoError] = useState(false)

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // Pause and reset on close
  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
    if (isOpen) {
      setVideoError(false)
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white/80 truncate pr-4">
                {gameTitle}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full glass-strong flex items-center justify-center text-white/50 hover:text-white transition-colors flex-shrink-0"
              >
                <HiX className="w-4 h-4" />
              </button>
            </div>

            {/* Video */}
            <div className="glass-strong rounded-2xl overflow-hidden">
              {videoError ? (
                <div className="aspect-video flex flex-col items-center justify-center gap-3 text-center p-6">
                  <p className="text-white/40 text-sm">Trailer unavailable</p>
                  <a
                    href={trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass glass-hover rounded-lg px-4 py-2 text-xs text-white/60 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <HiExternalLink className="w-3.5 h-3.5" />
                    Open in browser
                  </a>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  src={trailerUrl}
                  autoPlay
                  controls
                  playsInline
                  onError={() => setVideoError(true)}
                  className="w-full aspect-video bg-black"
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
