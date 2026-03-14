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
  onPlayTrailer?: (game: Game) => void
  onRefresh?: (gameId: string) => Promise<void>
  onPin?: () => void
  onPollRankSelect?: (gameId: string, rank: number | null) => void
  rank: number
  index: number
  hasVoted: boolean
  isPinned?: boolean
  size?: CardSize
  isDraggable?: boolean
  pollRank?: number | null
  pollVoteCount?: number
  isPollActive?: boolean
  userPollRanks?: { [rank: number]: string }
  searchTerm?: string
}

const SortableGameCard = forwardRef<HTMLDivElement, SortableGameCardProps>(function SortableGameCard({
  game,
  isDraggable = true,
  onRefresh: _onRefresh,
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
    willChange: isDragging ? 'transform' : 'auto',
  } as React.CSSProperties

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
      <GameCard game={game} {...props} isDragging={isDragging} />
    </div>
  )
})

export default SortableGameCard
