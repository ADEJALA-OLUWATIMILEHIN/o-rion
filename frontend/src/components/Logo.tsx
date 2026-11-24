import { Link } from 'react-router'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('flex shrink-0 items-center gap-2 font-extrabold tracking-tight whitespace-nowrap text-plum', className)} aria-label="O-Rion home">
      <span className="grid size-9 place-items-center rounded-full bg-primary shadow-lift">
        <span className="size-4 rounded-full border-[3.5px] border-white" />
      </span>
      <span className="text-xl">O-Rion</span>
    </Link>
  )
}
