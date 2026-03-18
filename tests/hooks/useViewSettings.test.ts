import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useViewSettings } from '@/lib/hooks/useViewSettings'

describe('useViewSettings', () => {
  it('starts with default values', () => {
    const { result } = renderHook(() => useViewSettings())

    expect(result.current.viewMode).toBe('grid')
    expect(result.current.cardSize).toBe('medium')
    expect(result.current.groupBy).toBe('none')
    expect(result.current.collapsedGroups).toEqual([])
  })

  it('updates view mode', () => {
    const { result } = renderHook(() => useViewSettings())

    act(() => {
      result.current.setViewMode('list')
    })

    expect(result.current.viewMode).toBe('list')
  })

  it('updates card size', () => {
    const { result } = renderHook(() => useViewSettings())

    act(() => {
      result.current.setCardSize('large')
    })

    expect(result.current.cardSize).toBe('large')
  })

  it('updates groupBy', () => {
    const { result } = renderHook(() => useViewSettings())

    act(() => {
      result.current.setGroupBy('genre')
    })

    expect(result.current.groupBy).toBe('genre')
  })

  it('toggles group collapse', () => {
    const { result } = renderHook(() => useViewSettings())

    act(() => {
      result.current.toggleGroupCollapse('FPS')
    })
    expect(result.current.collapsedGroups).toEqual(['FPS'])

    act(() => {
      result.current.toggleGroupCollapse('FPS')
    })
    expect(result.current.collapsedGroups).toEqual([])
  })

  it('can collapse multiple groups', () => {
    const { result } = renderHook(() => useViewSettings())

    act(() => {
      result.current.toggleGroupCollapse('FPS')
    })
    act(() => {
      result.current.toggleGroupCollapse('RPG')
    })

    expect(result.current.collapsedGroups).toEqual(['FPS', 'RPG'])
  })
})
