'use client'

import { useCallback, useEffect, useState, RefObject } from 'react'

interface UseKeyboardNavigationOptions {
  items: { id: string }[]
  gridColumns?: number
  onSelect?: (id: string) => void
  onEscape?: () => void
  enabled?: boolean
  searchInputRef?: RefObject<HTMLInputElement>
}

export function useKeyboardNavigation({
  items,
  gridColumns = 4,
  onSelect,
  onEscape,
  enabled = true,
  searchInputRef,
}: UseKeyboardNavigationOptions) {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    // Check if we're in an input/textarea
    const target = e.target as HTMLElement
    const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

    // Handle Escape - always works
    if (e.key === 'Escape') {
      if (isInInput) {
        target.blur()
      } else if (onEscape) {
        onEscape()
      }
      setFocusedIndex(-1)
      return
    }

    // Don't handle other keys when in input
    if (isInInput) return

    // Focus search with / or Ctrl+K
    if (e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault()
      searchInputRef?.current?.focus()
      return
    }

    // Navigation requires items
    if (items.length === 0) return

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        setFocusedIndex(prev => {
          if (prev < 0) return 0
          return Math.min(prev + 1, items.length - 1)
        })
        break

      case 'ArrowLeft':
        e.preventDefault()
        setFocusedIndex(prev => {
          if (prev < 0) return 0
          return Math.max(prev - 1, 0)
        })
        break

      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => {
          if (prev < 0) return 0
          const nextIndex = prev + gridColumns
          return nextIndex < items.length ? nextIndex : prev
        })
        break

      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => {
          if (prev < 0) return 0
          const nextIndex = prev - gridColumns
          return nextIndex >= 0 ? nextIndex : prev
        })
        break

      case 'Enter':
      case ' ':
        if (focusedIndex >= 0 && focusedIndex < items.length) {
          e.preventDefault()
          onSelect?.(items[focusedIndex].id)
        }
        break

      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        break

      case 'End':
        e.preventDefault()
        setFocusedIndex(items.length - 1)
        break

      case 'Tab':
        // Reset focus when tabbing
        setFocusedIndex(-1)
        break
    }
  }, [enabled, items, gridColumns, onSelect, onEscape, focusedIndex, searchInputRef])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Reset focus when items change
  useEffect(() => {
    if (focusedIndex >= items.length) {
      setFocusedIndex(items.length > 0 ? items.length - 1 : -1)
    }
  }, [items.length, focusedIndex])

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < items.length) {
      const element = document.querySelector(`[data-game-id="${items[focusedIndex].id}"]`)
      element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [focusedIndex, items])

  return {
    focusedIndex,
    focusedId: focusedIndex >= 0 ? items[focusedIndex]?.id : null,
    setFocusedIndex,
    resetFocus: () => setFocusedIndex(-1),
  }
}

// Hook to determine grid columns based on card size and viewport
export function useGridColumns(cardSize: 'small' | 'medium' | 'large'): number {
  const [columns, setColumns] = useState(4)

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth

      if (cardSize === 'small') {
        if (width >= 1536) setColumns(6)      // 2xl
        else if (width >= 1280) setColumns(5) // xl
        else if (width >= 1024) setColumns(4) // lg
        else if (width >= 640) setColumns(3)  // sm
        else setColumns(2)
      } else if (cardSize === 'large') {
        if (width >= 1536) setColumns(3)      // 2xl
        else if (width >= 1024) setColumns(2) // lg
        else setColumns(1)
      } else {
        // medium
        if (width >= 1536) setColumns(4)      // 2xl
        else if (width >= 1280) setColumns(3) // xl
        else if (width >= 640) setColumns(2)  // sm
        else setColumns(1)
      }
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [cardSize])

  return columns
}
