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
    <AnimatePresence>
      {isVisible && (
        <div className="fixed bottom-6 right-6 z-50 sm:hidden">
          {/* Backdrop when open */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm -z-10"
              />
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <AnimatePresence>
            {isOpen && (
              <div className="absolute bottom-16 right-0 flex flex-col items-end gap-3 mb-3">
                {actions.map((action, index) => (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    transition={{ delay: (actions.length - 1 - index) * 0.05 }}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className="flex items-center gap-3 disabled:opacity-50"
                  >
                    <span className="glass-strong px-3 py-1.5 rounded-lg text-sm font-medium text-white whitespace-nowrap">
                      {action.label}
                    </span>
                    <div className="w-12 h-12 rounded-full glass-strong flex items-center justify-center text-white shadow-lg">
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
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrimaryClick}
            onContextMenu={(e) => {
              e.preventDefault()
              handleLongPress()
            }}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
            }}
            aria-label={isOpen ? 'Close menu' : 'Add game'}
            aria-expanded={isOpen}
            aria-haspopup="menu"
          >
            <motion.div
              animate={{ rotate: isOpen ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isOpen ? (
                <HiX className="w-6 h-6" />
              ) : (
                <HiPlus className="w-6 h-6" />
              )}
            </motion.div>

            {/* Expand indicator - small dots around the button */}
            {!isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white/20"
              />
            )}
          </motion.button>

          {/* Swipe up hint */}
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] text-white/40 whitespace-nowrap"
            >
              Hold for more
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  )
}
