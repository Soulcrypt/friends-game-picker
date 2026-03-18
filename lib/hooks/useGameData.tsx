'use client'

import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  getGames,
  voteForGame,
  getSessionId,
  getUserVotes,
  removeGame,
  restoreGame,
  updateGameCover,
} from '../votes'
import { fetchSteamCoverByTitle } from '../steam'
import { LOADING_TIMEOUT_MS } from '../constants'
import type { Game } from '../types'

export function useGameData() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [votedGames, setVotedGames] = useState<string[]>([])
  const [isRefreshingAll, setIsRefreshingAll] = useState(false)

  async function enrichCovers(loadedGames: Game[]) {
    const needsEnrich = loadedGames.filter(
      g => !g.cover || g.cover.startsWith('/covers/')
    )
    if (needsEnrich.length === 0) return

    const steamDataResults = await Promise.all(
      needsEnrich.map(game =>
        fetchSteamCoverByTitle(game.title).catch(() => null)
      )
    )

    const enrichedGames: Record<string, Partial<Game>> = {}

    for (let i = 0; i < needsEnrich.length; i++) {
      const game = needsEnrich[i]
      const steamData = steamDataResults[i]
      if (!steamData?.cover) continue

      enrichedGames[game.id] = {
        cover: steamData.cover,
        rawg_id: steamData.steam_appid,
        steam_appid: steamData.steam_appid,
        metacritic: steamData.metacritic ?? undefined,
        trailer_url: steamData.trailer_url,
        screenshots: steamData.screenshots,
        platforms: steamData.platforms,
        developers: steamData.developers,
        publishers: steamData.publishers,
        release_date: steamData.release_date,
        short_description: steamData.short_description,
        categories: steamData.categories,
      }

      updateGameCover(
        game.id,
        steamData.cover,
        steamData.steam_appid,
        steamData.metacritic ?? undefined,
        steamData.trailer_url
      )
    }

    setGames(prev =>
      prev.map(g => {
        const enriched = enrichedGames[g.id]
        if (!enriched) return g
        return { ...g, ...enriched }
      })
    )
  }

  const loadGames = useCallback(async () => {
    try {
      const data = await getGames()
      setGames(data)
      enrichCovers(data)
    } catch (error) {
      console.error('Error loading games:', error)
      toast.error('Failed to load games')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadUserVotes = useCallback(async () => {
    const sessionId = getSessionId()
    if (!sessionId) return
    const votes = await getUserVotes(sessionId)
    setVotedGames(votes)
  }, [])

  const initializeData = useCallback(async () => {
    const loadingTimeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          console.warn('Loading timeout reached, forcing load complete')
          return false
        }
        return prev
      })
    }, LOADING_TIMEOUT_MS)

    await Promise.all([loadGames(), loadUserVotes()])

    clearTimeout(loadingTimeout)
  }, [loadGames, loadUserVotes])

  const handleVote = useCallback(async (gameId: string) => {
    try {
      const sessionId = getSessionId()
      const result = await voteForGame(gameId, sessionId)

      setGames(prevGames =>
        prevGames.map(game =>
          game.id === gameId ? { ...game, votes: result.votes } : game
        )
      )

      setVotedGames(prev =>
        result.voted
          ? [...prev, gameId]
          : prev.filter(id => id !== gameId)
      )
    } catch (error) {
      console.error('Error voting:', error)
      toast.error('Failed to vote')
    }
  }, [])

  const handleRemove = useCallback(async (gameId: string, title: string) => {
    const gameToRemove = games.find(g => g.id === gameId)
    if (!gameToRemove) return

    setGames(prev => prev.filter(g => g.id !== gameId))
    setVotedGames(prev => prev.filter(id => id !== gameId))

    let undoClicked = false

    toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span>{title} removed</span>
          <button
            onClick={async () => {
              undoClicked = true
              toast.dismiss(t.id)
              setGames(prev => [...prev, gameToRemove])
              const restored = await restoreGame(gameToRemove)
              if (restored) {
                toast.success(`${title} restored!`)
              } else {
                toast.error('Failed to restore game')
                setGames(prev => prev.filter(g => g.id !== gameId))
              }
            }}
            className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
          >
            Undo
          </button>
        </div>
      ),
      { duration: 5000, icon: '🗑️' }
    )

    setTimeout(async () => {
      if (!undoClicked) {
        const success = await removeGame(gameId)
        if (!success) {
          setGames(prev => [...prev, gameToRemove])
          toast.error('Failed to remove game')
        }
      }
    }, 5500)
  }, [games])

  const handleRefresh = useCallback(async (gameId: string) => {
    const game = games.find(g => g.id === gameId)
    if (!game) return

    toast.loading('Refreshing game data...', { id: 'refresh' })

    try {
      const steamData = await fetchSteamCoverByTitle(game.title)
      if (!steamData) {
        toast.error('Could not fetch game data', { id: 'refresh' })
        return
      }

      await updateGameCover(
        game.id,
        steamData.cover,
        steamData.steam_appid,
        steamData.metacritic ?? undefined,
        steamData.trailer_url
      )

      setGames(prev =>
        prev.map(g =>
          g.id === gameId
            ? {
                ...g,
                cover: steamData.cover,
                steam_appid: steamData.steam_appid,
                rawg_id: steamData.steam_appid,
                metacritic: steamData.metacritic ?? g.metacritic,
                trailer_url: steamData.trailer_url || g.trailer_url,
                screenshots: steamData.screenshots || g.screenshots,
                platforms: steamData.platforms || g.platforms,
                developers: steamData.developers || g.developers,
                publishers: steamData.publishers || g.publishers,
                release_date: steamData.release_date || g.release_date,
                short_description: steamData.short_description || g.short_description,
                categories: steamData.categories || g.categories,
              }
            : g
        )
      )

      toast.success('Game data refreshed!', { id: 'refresh' })
    } catch (error) {
      console.error('Error refreshing game:', error)
      toast.error('Failed to refresh game data', { id: 'refresh' })
    }
  }, [games])

  const handleRefreshAll = useCallback(async () => {
    if (games.length === 0 || isRefreshingAll) return

    setIsRefreshingAll(true)
    toast.loading(`Refreshing ${games.length} games...`, { id: 'refresh-all' })

    try {
      const steamDataResults = await Promise.all(
        games.map(game =>
          fetchSteamCoverByTitle(game.title).catch(() => null)
        )
      )

      const updatedGames: Game[] = []
      let successCount = 0

      for (let i = 0; i < games.length; i++) {
        const game = games[i]
        const steamData = steamDataResults[i]

        if (steamData) {
          successCount++
          updatedGames.push({
            ...game,
            cover: steamData.cover,
            steam_appid: steamData.steam_appid,
            rawg_id: steamData.steam_appid,
            metacritic: steamData.metacritic ?? game.metacritic,
            trailer_url: steamData.trailer_url || game.trailer_url,
            screenshots: steamData.screenshots || game.screenshots,
            platforms: steamData.platforms || game.platforms,
            developers: steamData.developers || game.developers,
            publishers: steamData.publishers || game.publishers,
            release_date: steamData.release_date || game.release_date,
            short_description: steamData.short_description || game.short_description,
            categories: steamData.categories || game.categories,
          })

          updateGameCover(
            game.id,
            steamData.cover,
            steamData.steam_appid,
            steamData.metacritic ?? undefined,
            steamData.trailer_url
          )
        } else {
          updatedGames.push(game)
        }
      }

      setGames(updatedGames)
      toast.success(`Refreshed ${successCount} of ${games.length} games!`, { id: 'refresh-all' })
    } catch (error) {
      console.error('Error refreshing all games:', error)
      toast.error('Failed to refresh games', { id: 'refresh-all' })
    } finally {
      setIsRefreshingAll(false)
    }
  }, [games, isRefreshingAll])

  const handleGameAdded = useCallback((game: Game) => {
    setGames(prev => [...prev, game])
  }, [])

  const handleImported = useCallback(() => {
    loadGames()
  }, [loadGames])

  return {
    games,
    loading,
    votedGames,
    isRefreshingAll,
    initializeData,
    handleVote,
    handleRemove,
    handleRefresh,
    handleRefreshAll,
    handleGameAdded,
    handleImported,
  }
}
