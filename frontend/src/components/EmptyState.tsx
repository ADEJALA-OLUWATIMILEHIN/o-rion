import type { ReactNode } from 'react'

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface px-6 py-12 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-white text-primary shadow-card [&_svg]:size-6">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {body ? <p className="max-w-xs text-sm text-muted-foreground">{body}</p> : null}
      {action}
    </div>
  )
}
