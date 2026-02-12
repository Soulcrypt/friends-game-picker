'use client'

import { forwardRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import GameCard from './GameCard'
import type { Game, CardSize } from '@/lib/types'

interface SortableGameCardProps {
  game: Game
  onVote: () => void
  onRemove: () => void
  onPlayTrailer: () => void
  onRefresh: (gameId: string) => Promise<void>
  onPin?: () => void
  onCompare?: () => void
  rank: number
  index: number
  hasVoted: boolean
  isPinned?: boolean
  isComparing?: boolean
  size?: CardSize
  isDraggable?: boolean
}

const SortableGameCard = forwardRef<HTMLDivElement, SortableGameCardProps>(function SortableGameCard({
  game,
  isDraggable = true,
  ...props
}, ref) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: game.id,
    disabled: !isDraggable,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  // Merge refs
  const mergedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node)
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }

  return (
    <div
      ref={mergedRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
    >
      <GameCard game={game} {...props} />
    </div>
  )
})

export default SortableGameCard
