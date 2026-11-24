import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Sticky back-button header used on sub-pages. */
export function PageHeader({ title, right, className, back = true }: { title: ReactNode; right?: ReactNode; className?: string; back?: boolean }) {
  const navigate = useNavigate()
  return (
    <div className={cn('sticky top-0 z-30 flex h-16 items-center gap-2 bg-white/90 px-2 backdrop-blur-md lg:top-16 lg:px-8', className)}>
      {back ? (
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="grid size-11 place-items-center rounded-full hover:bg-surface"
          aria-label="Back"
        >
          <ArrowLeft className="size-6" />
        </button>
      ) : null}
      <h1 className={cn('min-w-0 flex-1 truncate text-xl font-bold tracking-tight', !back && 'px-2')}>{title}</h1>
      {right}
    </div>
  )
}
