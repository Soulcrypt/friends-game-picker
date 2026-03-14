'use client'

import { useRef, useMemo } from 'react'
import { AnimatePresence, LayoutGroup } from 'framer-motion'
import { useVirtualizer } from '@tanstack/react-virtual'
import GameListItem from '../GameListItem'
import type { Game } from '@/lib/types'

interface ListViewProps {
  games: Game[]
  votedGames: string[]
  compact?: boolean
  onVote: (gameId: string) => void
  onRemove: (gameId: string, title: string) => void
  onPlayTrailer: (game: Game) => void
  onCardClick: (game: Game) => void
}

// Threshold for when to use virtualization
const VIRTUALIZATION_THRESHOLD = 50

export default function ListView({
  games,
  votedGames,
  compact = false,
  onVote,
  onRemove,
  onPlayTrailer,
  onCardClick,
}: ListViewProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Only use virtualization for large lists
  const useVirtual = games.length > VIRTUALIZATION_THRESHOLD

  const rowVirtualizer = useVirtualizer({
    count: games.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (compact ? 52 : 76), // Approximate row height
    overscan: 5,
    enabled: useVirtual,
  })

  // For small lists, render normally with animations
  if (!useVirtual) {
    return (
      <LayoutGroup>
        <div className={compact ? 'space-y-1' : 'space-y-2'}>
          <AnimatePresence mode="popLayout">
            {games.map((game, index) => (
              <GameListItem
                key={game.id}
                game={game}
                onVote={() => onVote(game.id)}
                onRemove={() => onRemove(game.id, game.title)}
                onPlayTrailer={() => onPlayTrailer(game)}
                onCardClick={() => onCardClick(game)}
                rank={index + 1}
                index={index}
                hasVoted={votedGames.includes(game.id)}
                compact={compact}
              />
            ))}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    )
  }

  // For large lists, use virtualization
  const items = rowVirtualizer.getVirtualItems()

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-300px)] overflow-auto scrollbar-hide"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualItem) => {
          const game = games[virtualItem.index]
          return (
            <div
              key={game.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className={compact ? 'pb-1' : 'pb-2'}>
                <GameListItem
                  game={game}
                  onVote={() => onVote(game.id)}
                  onRemove={() => onRemove(game.id, game.title)}
                  onPlayTrailer={() => onPlayTrailer(game)}
                  onCardClick={() => onCardClick(game)}
                  rank={virtualItem.index + 1}
                  index={virtualItem.index}
                  hasVoted={votedGames.includes(game.id)}
                  compact={compact}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
