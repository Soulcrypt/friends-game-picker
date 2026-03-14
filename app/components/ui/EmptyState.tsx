'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface EmptyStateAction {
  label: string
  onClick: () => void
  primary?: boolean
}

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  compact?: boolean
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center text-center px-4 ${
        compact ? 'py-8' : 'py-16 sm:py-24'
      }`}
    >
      {/* Icon container with subtle animation */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className={`rounded-2xl surface-card flex items-center justify-center mb-6 ${
          compact ? 'w-16 h-16' : 'w-20 h-20'
        }`}
      >
        <span className="text-text-muted">{icon}</span>
      </motion.div>

      <h2
        className={`font-semibold text-text-secondary mb-2 ${
          compact ? 'text-base' : 'text-lg sm:text-xl'
        }`}
      >
        {title}
      </h2>

      <p
        className={`text-text-tertiary mb-8 max-w-md leading-relaxed ${
          compact ? 'text-sm' : 'text-sm sm:text-base'
        }`}
      >
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.onClick}
              className={`rounded-xl px-6 py-3 text-sm font-medium flex items-center justify-center gap-2 min-h-[44px] ${
                action.primary !== false
                  ? 'btn-primary'
                  : 'btn-secondary'
              }`}
            >
              {action.label}
            </motion.button>
          )}

          {secondaryAction && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={secondaryAction.onClick}
              className="btn-ghost rounded-xl px-6 py-3 text-sm font-medium min-h-[44px]"
            >
              {secondaryAction.label}
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  )
}

// Preset empty states
export function NoGamesEmptyState({ onAddGame }: { onAddGame: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      }
      title="Your collection is empty"
      description="Add some games to start voting with your friends. Search for any game and it will automatically fetch cover art and details."
      action={{
        label: 'Add Your First Game',
        onClick: onAddGame,
        primary: true,
      }}
    />
  )
}

export function NoResultsEmptyState({
  searchTerm,
  onClearSearch,
}: {
  searchTerm: string
  onClearSearch: () => void
}) {
  return (
    <EmptyState
      icon={
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      title={`No games found for "${searchTerm}"`}
      description="Try a different search term, check the spelling, or browse by genre instead."
      action={{
        label: 'Clear Search',
        onClick: onClearSearch,
        primary: false,
      }}
    />
  )
}

export function NoFilterMatchesEmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
      }
      title="No games match your filters"
      description="Try adjusting your search term or removing some filters to see more games."
      action={{
        label: 'Clear All Filters',
        onClick: onClearFilters,
        primary: false,
      }}
    />
  )
}
