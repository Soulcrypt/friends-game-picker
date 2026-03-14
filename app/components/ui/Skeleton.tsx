'use client'

interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle' | 'card'
  width?: string | number
  height?: string | number
  className?: string
}

export default function Skeleton({
  variant = 'rect',
  width,
  height,
  className = '',
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded-md',
    rect: 'rounded-lg',
    circle: 'rounded-full',
    card: 'rounded-xl',
  }

  return (
    <div
      className={`animate-shimmer ${variantClasses[variant]} ${className}`}
      style={{
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : '100%'),
        background:
          'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 100%)',
        backgroundSize: '200% 100%',
      }}
    />
  )
}

// Game card skeleton preset
export function GameCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="surface-card rounded-xl overflow-hidden flex">
        <Skeleton variant="rect" width="112px" height="100%" className="shrink-0" />
        <div className="p-3 flex-1 space-y-2">
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
    )
  }

  return (
    <div className="surface-card rounded-xl overflow-hidden">
      <Skeleton variant="card" height="120px" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <Skeleton variant="rect" width="60px" height="24px" />
          <Skeleton variant="rect" width="40px" height="24px" />
        </div>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
      </div>
    </div>
  )
}

// Search results skeleton
export function SearchResultsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 surface-card rounded-lg"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <Skeleton variant="rect" width="48px" height="48px" className="shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Grid skeleton
export function GridSkeleton({ count = 8, columns = 4 }: { count?: number; columns?: number }) {
  return (
    <div
      className="grid gap-5"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  )
}
