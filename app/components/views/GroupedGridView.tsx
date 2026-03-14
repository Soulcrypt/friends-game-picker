'use client'

import { AnimatePresence, LayoutGroup } from 'framer-motion'
import { HiChevronDown, HiChevronRight } from 'react-icons/hi'
import GameCard from '../GameCard'
import type { Game, CardSize } from '@/lib/types'
import { GRID_CLASSES } from '@/lib/constants'

interface GroupedGridViewProps {
  groupedGames: [string, Game[]][]
  votedGames: string[]
  pinnedGames: string[]
  collapsedGroups: string[]
  cardSize: CardSize
  isPollActive: boolean
  userPollRanks: { [rank: number]: string }
  onVote: (gameId: string) => void
  onRemove: (gameId: string, title: string) => void
  onPin: (gameId: string) => void
  onPlayTrailer: (game: Game) => void
  onPollRankSelect: (gameId: string, rank: number | null) => void
  onToggleGroup: (groupName: string) => void
  getGamePollRank: (gameId: string) => number | null
  getGamePollPoints: (gameId: string) => number
}

export default function GroupedGridView({
  groupedGames,
  votedGames,
  pinnedGames,
  collapsedGroups,
  cardSize,
  isPollActive,
  userPollRanks,
  onVote,
  onRemove,
  onPin,
  onPlayTrailer,
  onPollRankSelect,
  onToggleGroup,
  getGamePollRank,
  getGamePollPoints,
}: GroupedGridViewProps) {
  const gridClass = GRID_CLASSES[cardSize]

  return (
    <LayoutGroup>
      <div className="space-y-6">
        {groupedGames.map(([groupName, games]) => (
          <div key={groupName}>
            <button
              onClick={() => onToggleGroup(groupName)}
              className="flex items-center gap-2 mb-3 text-white/80 hover:text-white transition-colors group"
            >
              {collapsedGroups.includes(groupName) ? (
                <HiChevronRight className="w-5 h-5" />
              ) : (
                <HiChevronDown className="w-5 h-5" />
              )}
              <h3 className="text-lg font-semibold">{groupName}</h3>
              <span className="text-sm text-white/40 group-hover:text-white/60">
                ({games.length})
              </span>
            </button>
            {!collapsedGroups.includes(groupName) && (
              <div className={`grid gap-5 ${gridClass}`}>
                <AnimatePresence mode="popLayout">
                  {games.map((game, index) => (
                    <GameCard
                      key={game.id}
                      game={game}
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
                      isPollActive={isPollActive}
                      pollRank={getGamePollRank(game.id)}
                      pollVoteCount={getGamePollPoints(game.id)}
                      userPollRanks={userPollRanks}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        ))}
      </div>
    </LayoutGroup>
  )
}
