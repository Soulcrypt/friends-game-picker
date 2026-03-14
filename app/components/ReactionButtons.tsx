'use client'

import { motion } from 'framer-motion'
import { HiOutlinePlay, HiCheck, HiStar } from 'react-icons/hi'
import type { ReactionType, ReactionCounts } from '@/lib/types'

interface ReactionButtonsProps {
  counts: ReactionCounts
  userReactions: ReactionType[]
  onToggle: (type: ReactionType) => void
}

const REACTIONS = [
  { type: 'played' as ReactionType, icon: HiOutlinePlay, label: 'Played It', activeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { type: 'own' as ReactionType, icon: HiCheck, label: 'Own It', activeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  { type: 'try' as ReactionType, icon: HiStar, label: 'Down to Try', activeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
]

export default function ReactionButtons({ counts, userReactions, onToggle }: ReactionButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      {REACTIONS.map(({ type, icon: Icon, label, activeClass }) => {
        const isActive = userReactions.includes(type)
        const count = counts[type]

        return (
          <motion.button
            key={type}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.stopPropagation()
              onToggle(type)
            }}
            title={label}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all duration-150 min-h-[36px] ${
              isActive
                ? activeClass
                : 'bg-transparent border-border text-text-tertiary hover:text-text-secondary hover:border-border-hover hover:bg-surface-hover'
            }`}
          >
            <Icon className="w-4 h-4" />
            {count > 0 && (
              <span className="text-xs font-semibold">{count}</span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
