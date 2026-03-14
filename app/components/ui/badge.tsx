import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border',
  {
    variants: {
      variant: {
        default: 'bg-primary/15 text-primary border-primary/25',
        secondary: 'bg-white/6 text-text-secondary border-white/8',
        green: 'bg-vote/15 text-vote border-vote/25',
        gold: 'bg-highlight-gold/15 text-highlight-gold border-highlight-gold/25',
        silver: 'bg-highlight-silver/15 text-highlight-silver border-highlight-silver/25',
        bronze: 'bg-highlight-bronze/15 text-highlight-bronze border-highlight-bronze/25',
        destructive: 'bg-error/15 text-error border-error/25',
        outline: 'border-white/10 text-text-secondary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
