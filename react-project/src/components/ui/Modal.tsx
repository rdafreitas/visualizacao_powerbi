'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open:      boolean
  onClose:   () => void
  title:     string
  children:  React.ReactNode
  footer?:   React.ReactNode
  maxWidth?: string
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-xl',
}: ModalProps) {
  // Bloqueia scroll do body quando modal está aberto
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else      document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={cn(
          'bg-white rounded-2xl w-full shadow-2xl animate-modal-in',
          'max-h-[90vh] flex flex-col',
          maxWidth
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0 mb-5 flex-shrink-0">
          <h3 className="font-poppins text-lg font-extrabold text-gray-dark">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-[#E8E8F0] flex items-center justify-center text-gray-mid hover:border-red hover:text-red transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-bg flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
