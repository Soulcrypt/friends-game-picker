import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ReactionButtons from '@/app/components/ReactionButtons'
import type { ReactionCounts, ReactionType } from '@/lib/types'

// Mock framer-motion to render plain elements
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: React.ComponentProps<'button'>) => (
      <button {...props}>{children}</button>
    ),
    div: ({ children, ...props }: React.ComponentProps<'div'>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('ReactionButtons', () => {
  const defaultCounts: ReactionCounts = { played: 0, own: 0, try: 0 }
  const defaultUserReactions: ReactionType[] = []

  it('renders three reaction buttons', () => {
    const onToggle = vi.fn()
    render(
      <ReactionButtons
        counts={defaultCounts}
        userReactions={defaultUserReactions}
        onToggle={onToggle}
      />
    )

    expect(screen.getByRole('button', { name: /Played It/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Own It/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Down to Try/i })).toBeInTheDocument()
  })

  it('shows counts when > 0', () => {
    const counts: ReactionCounts = { played: 3, own: 1, try: 0 }
    const onToggle = vi.fn()
    render(
      <ReactionButtons
        counts={counts}
        userReactions={defaultUserReactions}
        onToggle={onToggle}
      />
    )

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('calls onToggle with correct type when clicked', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(
      <ReactionButtons
        counts={defaultCounts}
        userReactions={defaultUserReactions}
        onToggle={onToggle}
      />
    )

    await user.click(screen.getByRole('button', { name: /Played It/i }))
    expect(onToggle).toHaveBeenCalledWith('played')

    await user.click(screen.getByRole('button', { name: /Own It/i }))
    expect(onToggle).toHaveBeenCalledWith('own')

    await user.click(screen.getByRole('button', { name: /Down to Try/i }))
    expect(onToggle).toHaveBeenCalledWith('try')
  })

  it('sets aria-pressed when reaction is active', () => {
    const onToggle = vi.fn()
    render(
      <ReactionButtons
        counts={defaultCounts}
        userReactions={['played', 'try']}
        onToggle={onToggle}
      />
    )

    expect(screen.getByRole('button', { name: /Played It/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Own It/i })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /Down to Try/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('includes count in aria-label', () => {
    const counts: ReactionCounts = { played: 5, own: 0, try: 2 }
    const onToggle = vi.fn()
    render(
      <ReactionButtons
        counts={counts}
        userReactions={defaultUserReactions}
        onToggle={onToggle}
      />
    )

    expect(screen.getByRole('button', { name: 'Played It (5)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Own It' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Down to Try (2)' })).toBeInTheDocument()
  })
})
