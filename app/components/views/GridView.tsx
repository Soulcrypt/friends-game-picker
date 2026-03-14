'use client'

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import SortableGameCard from '../SortableGameCard'
import type { Game, CardSize } from '@/lib/types'
import { GRID_CLASSES } from '@/lib/constants'

interface GridViewProps {
  games: Game[]
  votedGames: string[]
  pinnedGames: string[]
  cardSize: CardSize
  sortBy: 'votes' | 'title'
  groupBy: 'none' | 'genre' | 'price'
  isPollActive: boolean
  userPollRanks: { [rank: number]: string }
  searchTerm?: string
  onVote: (gameId: string) => void
  onRemove: (gameId: string, title: string) => void
  onPin: (gameId: string) => void
  onPlayTrailer: (game: Game) => void
  onPollRankSelect: (gameId: string, rank: number | null) => void
  onDragEnd: (event: DragEndEvent) => void
  getGamePollRank: (gameId: string) => number | null
  getGamePollPoints: (gameId: string) => number
}

export default function GridView({
  games,
  votedGames,
  pinnedGames,
  cardSize,
  sortBy,
  groupBy,
  isPollActive,
  userPollRanks,
  searchTerm = '',
  onVote,
  onRemove,
  onPin,
  onPlayTrailer,
  onPollRankSelect,
  onDragEnd,
  getGamePollRank,
  getGamePollPoints,
}: GridViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const gridClass = GRID_CLASSES[cardSize]

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={games.map(g => g.id)}
        strategy={rectSortingStrategy}
      >
        <LayoutGroup>
          <div className={`grid gap-5 games-grid ${gridClass}`}>
            <AnimatePresence mode="popLayout">
              {games.map((game, index) => (
                <motion.div key={game.id} layout transition={{ type: 'spring', stiffness: 350, damping: 35 }}>
                  <SortableGameCard
                    game={game}
                    searchTerm={searchTerm}
                    onVote={() => onVote(game.id)}
                    onRemove={() => onRemove(game.id, game.title)}
                    onPin={() => onPin(game.id)}
                    onPlayTrailer={onPlayTrailer}
                    onPollRankSelect={onPollRankSelect}
                    rank={index + 1}
                    index={index}
                    hasVoted={votedGames.includes(game.id)}
                    isPinned={pinnedGames.includes(game.id)}
                    size={cardSize}
                    isDraggable={sortBy === 'votes' && groupBy === 'none'}
                    isPollActive={isPollActive}
                    pollRank={getGamePollRank(game.id)}
                    pollVoteCount={getGamePollPoints(game.id)}
                    userPollRanks={userPollRanks}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      </SortableContext>
    </DndContext>
  )
}
