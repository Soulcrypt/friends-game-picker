import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useCompare } from '@/lib/hooks/useCompare'

describe('useCompare', () => {
  it('starts with empty compare list', () => {
    const { result } = renderHook(() => useCompare())
    expect(result.current.compareGames).toEqual([])
  })

  it('toggles a game into compare list', () => {
    const { result } = renderHook(() => useCompare())

    act(() => {
      result.current.toggleCompare('game-1')
    })

    expect(result.current.compareGames).toEqual(['game-1'])
  })

  it('toggles a game out of compare list', () => {
    const { result } = renderHook(() => useCompare())

    act(() => {
      result.current.toggleCompare('game-1')
    })
    act(() => {
      result.current.toggleCompare('game-1')
    })

    expect(result.current.compareGames).toEqual([])
  })

  it('limits compare to 3 games', () => {
    const { result } = renderHook(() => useCompare())

    act(() => {
      result.current.toggleCompare('game-1')
      result.current.toggleCompare('game-2')
      result.current.toggleCompare('game-3')
    })

    // Fourth game should not be added
    act(() => {
      result.current.toggleCompare('game-4')
    })

    expect(result.current.compareGames).toHaveLength(3)
    expect(result.current.compareGames).not.toContain('game-4')
  })

  it('clearCompare empties the list', () => {
    const { result } = renderHook(() => useCompare())

    act(() => {
      result.current.toggleCompare('game-1')
      result.current.toggleCompare('game-2')
    })
    act(() => {
      result.current.clearCompare()
    })

    expect(result.current.compareGames).toEqual([])
  })
})
