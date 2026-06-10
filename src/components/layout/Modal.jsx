import { X } from 'lucide-react'

export function Modal({ isOpen, title, onClose, children, wide = false, footer }) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`bg-surface rounded-xl shadow-2xl max-h-[92vh] overflow-y-auto animate-slide-up ${
          wide ? 'w-[min(860px,96vw)]' : 'w-[min(680px,96vw)]'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border p-6 flex items-center justify-between z-10">
          <h3 className="font-display text-xl text-navy">{title}</h3>
          <button
            onClick={onClose}
            className="btn btn-sm"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="sticky bottom-0 bg-bg border-t border-border p-4 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
