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
  { type: 'played' as ReactionType, icon: HiOutlinePlay, label: 'Played It', activeColor: 'text-emerald-400' },
  { type: 'own' as ReactionType, icon: HiCheck, label: 'Own It', activeColor: 'text-blue-400' },
  { type: 'try' as ReactionType, icon: HiStar, label: 'Down to Try', activeColor: 'text-amber-400' },
]

export default function ReactionButtons({ counts, userReactions, onToggle }: ReactionButtonsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {REACTIONS.map(({ type, icon: Icon, label, activeColor }) => {
        const isActive = userReactions.includes(type)
        const count = counts[type]

        return (
          <motion.button
            key={type}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation()
              onToggle(type)
            }}
            title={label}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
              isActive
                ? `glass ${activeColor}`
                : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {count > 0 && (
              <span className="text-[10px] font-medium">{count}</span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
