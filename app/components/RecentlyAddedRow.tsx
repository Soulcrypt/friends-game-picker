'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'
import type { Game } from '@/lib/types'

interface RecentlyAddedRowProps {
  games: Game[]
  onGameClick: (game: Game) => void
}

export default function RecentlyAddedRow({ games, onGameClick }: RecentlyAddedRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = 200
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  if (games.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.1em] flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          Recently Added
        </h2>
        <div className="flex gap-1.5">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-xl transition-all duration-150 text-text-tertiary hover:text-text-primary"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <HiChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-xl transition-all duration-150 text-text-tertiary hover:text-text-primary"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <HiChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
      >
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3, scale: 1.02 }}
            onClick={() => onGameClick(game)}
            className="relative flex-shrink-0 w-52 cursor-pointer group"
            style={{
              background: 'linear-gradient(160deg, #1C2030 0%, #12151F 100%)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: '2px',
              overflow: 'hidden',
              transition: 'box-shadow 0.25s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            {/* NEW badge */}
            <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/90 text-white shadow-lg">
              New
            </div>

            {/* Cover */}
            <div className="aspect-video overflow-hidden bg-surface">
              {game.cover ? (
                <img
                  src={game.cover}
                  alt={game.title}
                  className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl text-text-muted">?</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </div>

            {/* Title */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="text-sm font-semibold text-white line-clamp-1 drop-shadow-lg">
                {game.title}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
