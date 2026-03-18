import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useFilterPresets } from '@/lib/hooks/useFilterPresets'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

function createFilterState() {
  let activeFilters = ['Co-op']
  let sortBy: 'votes' | 'title' = 'votes'
  return {
    get activeFilters() { return activeFilters },
    get sortBy() { return sortBy },
    setActiveFilters: (f: string[]) => { activeFilters = f },
    setSortBy: (s: 'votes' | 'title') => { sortBy = s },
  }
}

describe('useFilterPresets', () => {
  it('starts with empty presets', () => {
    const filterState = createFilterState()
    const { result } = renderHook(() => useFilterPresets(filterState))
    expect(result.current.filterPresets).toEqual([])
  })

  it('saves a filter preset', () => {
    const filterState = createFilterState()
    const { result } = renderHook(() => useFilterPresets(filterState))

    act(() => {
      result.current.saveFilterPreset('Co-op Games')
    })

    expect(result.current.filterPresets).toHaveLength(1)
    expect(result.current.filterPresets[0].name).toBe('Co-op Games')
    expect(result.current.filterPresets[0].filters).toEqual(['Co-op'])
    expect(result.current.filterPresets[0].sortBy).toBe('votes')
  })

  it('deletes a filter preset', () => {
    const filterState = createFilterState()
    const { result } = renderHook(() => useFilterPresets(filterState))

    act(() => {
      result.current.saveFilterPreset('Co-op Games')
    })

    const presetId = result.current.filterPresets[0].id

    act(() => {
      result.current.deleteFilterPreset(presetId)
    })

    expect(result.current.filterPresets).toHaveLength(0)
  })

  it('persists presets to localStorage', () => {
    const filterState = createFilterState()
    const { result } = renderHook(() => useFilterPresets(filterState))

    act(() => {
      result.current.saveFilterPreset('Test Preset')
    })

    const stored = JSON.parse(localStorage.getItem('filterPresets') || '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('Test Preset')
  })

  it('loads presets from localStorage on mount', () => {
    const preset = {
      id: '123',
      name: 'Saved Preset',
      filters: ['Horror'],
      sortBy: 'title',
    }
    localStorage.setItem('filterPresets', JSON.stringify([preset]))

    const filterState = createFilterState()
    const { result } = renderHook(() => useFilterPresets(filterState))

    expect(result.current.filterPresets).toHaveLength(1)
    expect(result.current.filterPresets[0].name).toBe('Saved Preset')
  })
})
