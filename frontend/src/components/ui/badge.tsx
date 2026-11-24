import * as React from 'react'
import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex h-5 items-center justify-center gap-1 rounded-full px-2 text-[10px] font-bold uppercase tracking-[0.04em] whitespace-nowrap shrink-0 [&>svg]:size-3 [&>svg]:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-surface text-accent',
        success: 'bg-success/12 text-emerald-700',
        deal: 'bg-deal/15 text-amber-700',
        outline: 'border border-primary/20 text-primary',
        destructive: 'bg-destructive/10 text-destructive',
        glass: 'bg-white/90 text-foreground backdrop-blur normal-case tracking-normal text-[11px] font-semibold',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span'
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants }
