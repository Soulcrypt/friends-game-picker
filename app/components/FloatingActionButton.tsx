'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiPlus, HiX, HiSparkles, HiUpload, HiShare } from 'react-icons/hi'

interface FloatingActionButtonProps {
  onAddGame: () => void
  onPickForUs: () => void
  onImport: () => void
  onShare: () => void
  gameCount: number
}

interface FABAction {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  gradient?: string
}

export default function FloatingActionButton({
  onAddGame,
  onPickForUs,
  onImport,
  onShare,
  gameCount,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Show FAB when scrolling down, hide when at top
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > 200) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
        setIsOpen(false)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const actions: FABAction[] = [
    {
      icon: <HiSparkles className="w-5 h-5" />,
      label: 'Pick For Us',
      onClick: () => {
        onPickForUs()
        setIsOpen(false)
      },
      disabled: gameCount === 0,
    },
    {
      icon: <HiUpload className="w-5 h-5" />,
      label: 'Import',
      onClick: () => {
        onImport()
        setIsOpen(false)
      },
    },
    {
      icon: <HiShare className="w-5 h-5" />,
      label: 'Share',
      onClick: () => {
        onShare()
        setIsOpen(false)
      },
      disabled: gameCount === 0,
    },
  ]

  const handlePrimaryClick = () => {
    if (isOpen) {
      setIsOpen(false)
    } else {
      // Primary action is Add Game
      onAddGame()
    }
  }

  const handleLongPress = () => {
    setIsOpen(true)
  }

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <div className="fixed bottom-6 right-6 z-50 sm:hidden">
          {/* Backdrop when open */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm -z-10"
              />
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <AnimatePresence>
            {isOpen && (
              <div className="absolute bottom-20 right-0 flex flex-col items-end gap-3 mb-3">
                {actions.map((action, index) => (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: (actions.length - 1 - index) * 0.04, duration: 0.2 }}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className="flex items-center gap-3 disabled:opacity-40"
                  >
                    <span className="backdrop-blur-xl px-4 py-2.5 rounded-xl text-sm font-medium text-text-primary whitespace-nowrap shadow-lg" style={{ background: 'rgba(22,26,35,0.92)', border: '1px solid rgba(255,255,255,0.09)' }}>
                      {action.label}
                    </span>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-text-primary shadow-lg active:scale-95 transition-transform duration-150" style={{ background: 'rgba(22,26,35,0.92)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(16px)' }}>
                      {action.icon}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Main FAB */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileTap={{ scale: 0.92 }}
            onClick={handlePrimaryClick}
            onContextMenu={(e) => {
              e.preventDefault()
              handleLongPress()
            }}
            className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl relative overflow-hidden active:scale-95 transition-all duration-150"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #6F38DC 100%)',
              boxShadow: isOpen
                ? '0 8px 32px rgba(139, 92, 246, 0.5)'
                : '0 4px 20px rgba(139, 92, 246, 0.38)',
            }}
            aria-label={isOpen ? 'Close menu' : 'Add game'}
            aria-expanded={isOpen}
            aria-haspopup="menu"
          >
            <motion.div
              animate={{ rotate: isOpen ? 45 : 0 }}
              transition={{ duration: 0.15 }}
            >
              {isOpen ? (
                <HiX className="w-7 h-7" />
              ) : (
                <HiPlus className="w-7 h-7" />
              )}
            </motion.div>

            {/* Expand indicator */}
            {!isOpen && (
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-surface" />
            )}
          </motion.button>

          {/* Hint text */}
          <AnimatePresence>
            {!isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] text-text-tertiary whitespace-nowrap"
              >
                Hold for more
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  )
}
