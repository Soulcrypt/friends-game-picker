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
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Recently Added
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-lg glass hover:bg-white/[0.08] transition-colors text-white/40 hover:text-white/70"
          >
            <HiChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-lg glass hover:bg-white/[0.08] transition-colors text-white/40 hover:text-white/70"
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={() => onGameClick(game)}
            className="relative flex-shrink-0 w-48 glass rounded-xl overflow-hidden cursor-pointer group"
          >
            {/* NEW badge */}
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-emerald-500/90 text-white shadow-lg">
              New
            </div>

            {/* Cover */}
            <div className="aspect-[460/215] overflow-hidden bg-white/[0.02]">
              {game.cover ? (
                <img
                  src={game.cover}
                  alt={game.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl text-white/10">?</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>

            {/* Title */}
            <div className="absolute bottom-0 left-0 right-0 p-2.5">
              <h3 className="text-xs font-medium text-white line-clamp-1 drop-shadow-lg">
                {game.title}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
