'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  show:    boolean
  onHide:  () => void
}

export function Toast({ message, show, onHide }: ToastProps) {
  useEffect(() => {
    if (!show) return
    const t = setTimeout(onHide, 2500)
    return () => clearTimeout(t)
  }, [show, onHide])

  if (!show) return null

  return (
    <div className="fixed bottom-8 left-1/2 z-[9999] -translate-x-1/2 animate-toast-in">
      <div className="bg-gray-dark text-white px-6 py-3 rounded-3xl text-sm font-semibold shadow-xl whitespace-nowrap">
        {message}
      </div>
    </div>
  )
}
