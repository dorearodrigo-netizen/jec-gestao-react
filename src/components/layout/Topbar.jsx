import { Plus } from 'lucide-react'

export function Topbar({ title, subtitle, count, onNewClick }) {
  return (
    <div className="fixed top-0 left-60 right-0 bg-surface border-b border-border z-40 h-20">
      <div className="h-full px-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-navy">{title}</h1>
          <p className="text-xs text-text3 mt-1">{subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          {count !== undefined && (
            <span className="text-xs text-text3">
              {count} {count === 1 ? 'item' : 'itens'}
            </span>
          )}
          {onNewClick && (
            <button
              onClick={onNewClick}
              className="btn btn-primary"
            >
              <Plus size={18} />
              Nova
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
