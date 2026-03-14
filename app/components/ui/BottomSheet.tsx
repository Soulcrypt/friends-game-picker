'use client'

import { useEffect, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  initialHeight?: string
  maxHeight?: string
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  initialHeight = '60vh',
  maxHeight = '90vh',
}: BottomSheetProps) {
  const dragY = useMotionValue(0)
  const backgroundOpacity = useTransform(dragY, [0, 300], [1, 0])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose()
    }
  }, [onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ opacity: backgroundOpacity }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={handleDragEnd}
            style={{ y: dragY }}
            className="fixed bottom-0 left-0 right-0 z-50 touch-none"
          >
            <div
              className="glass-elevated rounded-t-2xl safe-bottom"
              style={{ maxHeight }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1.5 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              {title && (
                <div className="px-5 pb-3 border-b border-white/[0.06]">
                  <h2 className="text-lg font-semibold text-white">{title}</h2>
                </div>
              )}

              {/* Content */}
              <div
                className="overflow-y-auto overscroll-contain px-5 pb-8"
                style={{ maxHeight: `calc(${initialHeight} - 60px)` }}
              >
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
