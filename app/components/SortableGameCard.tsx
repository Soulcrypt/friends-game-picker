'use client'

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

export default function SortableGameCard({
  game,
  isDraggable = true,
  ...props
}: SortableGameCardProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
    >
      <GameCard game={game} {...props} />
    </div>
  )
}
