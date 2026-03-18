'use client'

import { useState, useCallback } from 'react'
import type { ViewMode, CardSize } from '../types'

export function useViewSettings() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [cardSize, setCardSize] = useState<CardSize>('medium')
  const [groupBy, setGroupBy] = useState<'none' | 'genre' | 'price'>('none')
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([])

  const toggleGroupCollapse = useCallback((groupName: string) => {
    setCollapsedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    )
  }, [])

  return {
    viewMode,
    setViewMode,
    cardSize,
    setCardSize,
    groupBy,
    setGroupBy,
    collapsedGroups,
    toggleGroupCollapse,
  }
}
