import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string
}

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} animate-slide-up dark:bg-espresso-800 dark:border-espresso-700`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-espresso-100 dark:border-espresso-700">
          <h3 className="font-display text-lg font-semibold text-espresso-900 dark:text-cream">{title}</h3>
          <button
            onClick={onClose}
            className="text-espresso-400 hover:text-espresso-700 text-xl leading-none transition-colors dark:text-espresso-300 dark:hover:text-cream"
          >
            ×
          </button>
        </div>
        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
