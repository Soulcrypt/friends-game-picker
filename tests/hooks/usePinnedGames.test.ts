import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { usePinnedGames } from '@/lib/hooks/usePinnedGames'

describe('usePinnedGames', () => {
  it('starts with empty pinned list', () => {
    const { result } = renderHook(() => usePinnedGames())
    expect(result.current.pinnedGames).toEqual([])
  })

  it('toggles a game into pinned list', () => {
    const { result } = renderHook(() => usePinnedGames())

    act(() => {
      result.current.togglePin('game-1')
    })

    expect(result.current.pinnedGames).toEqual(['game-1'])
  })

  it('toggles a game out of pinned list', () => {
    const { result } = renderHook(() => usePinnedGames())

    act(() => {
      result.current.togglePin('game-1')
    })
    act(() => {
      result.current.togglePin('game-1')
    })

    expect(result.current.pinnedGames).toEqual([])
  })

  it('persists pinned games to localStorage', () => {
    const { result } = renderHook(() => usePinnedGames())

    act(() => {
      result.current.togglePin('game-1')
    })

    const stored = JSON.parse(localStorage.getItem('pinnedGames') || '[]')
    expect(stored).toEqual(['game-1'])
  })

  it('loads pinned games from localStorage on mount', () => {
    localStorage.setItem('pinnedGames', JSON.stringify(['game-a', 'game-b']))

    const { result } = renderHook(() => usePinnedGames())

    expect(result.current.pinnedGames).toEqual(['game-a', 'game-b'])
  })

  it('can pin multiple games', () => {
    const { result } = renderHook(() => usePinnedGames())

    act(() => {
      result.current.togglePin('game-1')
    })
    act(() => {
      result.current.togglePin('game-2')
    })
    act(() => {
      result.current.togglePin('game-3')
    })

    expect(result.current.pinnedGames).toEqual(['game-1', 'game-2', 'game-3'])
  })
})
