import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

describe('useFocusTrap', () => {
  it('returns a ref object', () => {
    const { result } = renderHook(() => useFocusTrap(false))
    expect(result.current).toHaveProperty('current')
  })

  it('ref is null when inactive', () => {
    const { result } = renderHook(() => useFocusTrap(false))
    expect(result.current.current).toBeNull()
  })
})
