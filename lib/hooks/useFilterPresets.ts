'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { STORAGE_KEYS } from '../constants'
import type { FilterPreset } from '../types'

interface FilterState {
  activeFilters: string[]
  sortBy: 'votes' | 'title'
  setActiveFilters: (filters: string[]) => void
  setSortBy: (sort: 'votes' | 'title') => void
}

export function useFilterPresets(filterState: FilterState) {
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.filterPresets)
    if (saved) {
      try {
        setFilterPresets(JSON.parse(saved))
      } catch {
        // ignore
      }
    }
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.filterPresets, JSON.stringify(filterPresets))
  }, [filterPresets])

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.filterPresets && e.newValue) {
        try {
          setFilterPresets(JSON.parse(e.newValue))
        } catch {
          // ignore
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const saveFilterPreset = useCallback((name: string) => {
    const preset: FilterPreset = {
      id: Date.now().toString(),
      name,
      filters: filterState.activeFilters,
      sortBy: filterState.sortBy,
    }
    setFilterPresets(prev => [...prev, preset])
    toast.success(`Preset "${name}" saved!`)
  }, [filterState.activeFilters, filterState.sortBy])

  const loadFilterPreset = useCallback((preset: FilterPreset) => {
    filterState.setActiveFilters(preset.filters)
    filterState.setSortBy(preset.sortBy)
    toast.success(`Loaded "${preset.name}"`)
  }, [filterState])

  const deleteFilterPreset = useCallback((presetId: string) => {
    setFilterPresets(prev => prev.filter(p => p.id !== presetId))
    toast.success('Preset deleted')
  }, [])

  return {
    filterPresets,
    saveFilterPreset,
    loadFilterPreset,
    deleteFilterPreset,
  }
}
